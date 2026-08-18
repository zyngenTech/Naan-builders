import { environment } from '../../environments/environment';

/**
 * Application logger.
 *
 * Every diagnostic in this app used to call `console.*` directly, which
 * meant ~220 log statements shipped to production and ran on every page
 * load - including ones that dumped whole Firestore documents (the full
 * `settings/site` object, inquiry payloads) straight into the browser
 * console for anyone with devtools open. Angular's `optimization: true`
 * does not strip `console` calls, so this could not be fixed at build
 * time; it needed a call-site indirection.
 *
 * `log` and `warn` are development-only and become no-ops in production
 * builds. `error` is deliberately NOT stripped: when something actually
 * breaks on a customer's phone, that message is the only diagnostic
 * anyone has, and errors are rare enough that they cost nothing.
 *
 * Note this reads `environment.production`, which is only ever `true`
 * because angular.json's production configuration swaps environment.ts
 * for environment.prod.ts via `fileReplacements`. Removing that entry
 * silently re-enables all logging in production.
 *
 * Usage is a drop-in for console: logger.log('[Thing] message', value)
 */
export const logger = {
  log(...args: unknown[]): void {
    if (!environment.production) {
      console.log(...args);
    }
  },

  warn(...args: unknown[]): void {
    if (!environment.production) {
      console.warn(...args);
    }
  },

  /** Always logged, in every build - see note above. */
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
