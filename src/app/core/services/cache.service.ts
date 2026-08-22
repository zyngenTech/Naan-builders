import { Injectable, PLATFORM_ID, TransferState, inject, makeStateKey } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, shareReplay, throwError, timer } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { logger } from '../logger';

interface CacheEntry<T> {
  data: Observable<T>;
  timestamp: number;
}

/**
 * CacheService
 * Wraps Observable requests to cache results and return the same Observable
 * for subsequent requests within the TTL (Time-To-Live). This prevents duplicate
 * Firebase requests when the same data is requested multiple times across
 * different components during page navigation.
 *
 * Usage:
 *   this.cache.get('gallery-items', () => this.firebaseService.getData(...))
 *
 * The returned Observable will be shared across all subscribers, and cached
 * results will be reused until the TTL expires (default 5 minutes).
 *
 * Also carries every result across the server/browser boundary via Angular's
 * TransferState (see the `get()` body). Every call site already passes a
 * key that uniquely identifies its exact query (e.g. ProjectService uses
 * 'projects-all', 'projects-featured' and `project-${id}` - three different
 * queries against the same "projects" collection), which makes this cache
 * key exactly the right thing to reuse as the TransferState key too.
 */
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private transferState = inject(TransferState);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /**
   * Get a value from cache, or execute the factory function and cache the result.
   * @param key Unique cache key
   * @param factory Function that returns an Observable
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   * @param useTransferState Reuse the server-prerendered value on first
   *   browser hydration instead of re-fetching (default true - see the
   *   long comment below). Pass `false` for data that must reflect an
   *   Admin edit immediately rather than "as of the last deploy" - right
   *   now that's just SettingsService (site-wide contact info: phone,
   *   email, address). Content that changes rarely and isn't operationally
   *   urgent (projects, gallery, testimonials, services, milestones) keeps
   *   the default: it stays a build-time snapshot until the next deploy,
   *   which is what makes it real, crawlable HTML for Google in the first
   *   place. This was found in production: an Admin changed the contact
   *   email, Firestore updated instantly, but the live site kept showing
   *   the old email (baked into the prerendered HTML) until redeploy - a
   *   wrong contact email is a lost-customer bug, not an acceptable
   *   staleness window, which is why settings gets its own opt-out.
   */
  get<T>(
    key: string,
    factory: () => Observable<T>,
    ttlMs: number = this.DEFAULT_TTL_MS,
    useTransferState = true
  ): Observable<T> {
    const now = Date.now();
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // Return cached Observable if still valid
    if (entry && now - entry.timestamp < ttlMs) {
      logger.log(`[CacheService] Cache hit for key "${key}" (age: ${now - entry.timestamp}ms)`);
      return entry.data;
    }

    // First browser-side read after hydration: reuse whatever the server
    // already fetched for this exact key instead of re-requesting it.
    // Without this, every prerendered page repaints from real content to a
    // loading spinner and back the instant the client boots and this same
    // `get()` call runs again with an empty in-memory cache - the server's
    // work (and the reason it was fetched with PendingTasks in the first
    // place) would otherwise be thrown away on every single page load.
    const transferKey = makeStateKey<T>(`cache:${key}`);
    if (useTransferState && this.isBrowser && this.transferState.hasKey(transferKey)) {
      logger.log(`[CacheService] Using server-transferred state for key "${key}"`);
      const transferred$ = of(this.transferState.get(transferKey, null as unknown as T));
      this.transferState.remove(transferKey); // one-shot: stale after this read, next TTL cycle should hit Firestore
      this.cache.set(key, { data: transferred$, timestamp: now });
      return transferred$;
    }
    // Still consume (and discard) any transferred state for this key even
    // when opted out, so it doesn't sit unused in the page's ng-state JSON.
    if (!useTransferState && this.isBrowser && this.transferState.hasKey(transferKey)) {
      this.transferState.remove(transferKey);
    }

    // Cache miss: execute factory, cache the result, and return
    logger.log(`[CacheService] Cache miss for key "${key}" - executing factory`);

    // The catchError below evicts the entry BEFORE re-throwing, so a
    // failed request is never served from cache.
    //
    // Without it, a single transient failure (flaky connection, brief
    // offline) poisons this key for the whole TTL: shareReplay defaults
    // to `resetOnError: false`, so the errored ReplaySubject stays in the
    // map and every later subscriber gets the same error replayed
    // instantly, without the factory ever being retried. In practice that
    // meant one failed settings fetch left the logo, contact details and
    // hero banner broken on every page for five minutes - even after the
    // connection came back. Evicting on error makes the next subscriber a
    // cache miss, which re-runs the factory and recovers.
    const data$ = factory().pipe(
      tap((value) => {
        // Only the server ever writes state to transfer - the browser
        // consumes it above and would otherwise just be re-saving its own
        // freshly-fetched data back into a state bag nobody reads again.
        if (!this.isBrowser && useTransferState) {
          this.transferState.set(transferKey, value);
        }
      }),
      catchError((error) => {
        logger.error(`[CacheService] Factory failed for key "${key}" - evicting so the next read retries`, error);
        // Only evict if this exact entry is still the cached one, so a
        // late failure can't clobber a newer successful entry.
        if (this.cache.get(key)?.data === data$) {
          this.cache.delete(key);
        }
        return throwError(() => error);
      }),
      shareReplay(1) // Share result across all subscribers, cache last emission
    );

    this.cache.set(key, { data: data$, timestamp: now });
    return data$;
  }

  /**
   * Invalidate a cache entry to force a refresh on next request
   */
  invalidate(key: string): void {
    logger.log(`[CacheService] Invalidating cache for key "${key}"`);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    logger.log(`[CacheService] Clearing all cache`);
    this.cache.clear();
  }

  /**
   * Refresh a cached value (invalidate + re-fetch after delay)
   * Useful for background refresh without interrupting current subscribers.
   *
   * The invalidate() below is load-bearing: without it, the get() call
   * inside the switchMap finds the still-valid entry and returns the
   * existing cached Observable, making this method a silent no-op.
   */
  refresh<T>(key: string, factory: () => Observable<T>, delayMs = 100): void {
    logger.log(`[CacheService] Refreshing cache for key "${key}"`);
    timer(delayMs)
      .pipe(
        switchMap(() => {
          this.invalidate(key);
          return this.get(key, factory);
        })
      )
      .subscribe({
        error: (error) => logger.error(`[CacheService] Refresh failed for key "${key}"`, error),
      });
  }
}
