import { PrerenderFallback, RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Server-route rendering config, used only by the build-time prerender step
 * (`ng build` with `prerender: true` in angular.json). This app is deployed
 * to Firebase Hosting as static files only - there is no Node server running
 * in production - so every route here resolves to one of two outcomes:
 *
 *   - RenderMode.Prerender: a real, fully-rendered HTML file is generated at
 *     build time and served as-is. This is what fixes the SEO/indexing
 *     problem - each public page ships unique title/headings/content in the
 *     first HTML response, instead of every route returning the same empty
 *     app shell.
 *   - RenderMode.Client: build time does nothing for this route; it falls
 *     back to today's plain client-side rendering (Firebase Hosting's
 *     rewrite already sends any unmatched path to index.html, and Angular's
 *     router takes over from there). Used for /admin and /admin/login,
 *     which require a live auth check and must never be prerendered or
 *     indexed.
 *
 * Public content routes fetch the real Firestore "projects" collection over
 * the same public REST endpoint scripts/generate-sitemap.mjs already uses
 * (world-readable per firestore.rules, no admin SDK/secret involved), so
 * every real project gets its own prerendered page. `fallback:
 * PrerenderFallback.Client` means a project added after the last deploy
 * still works correctly - it just renders client-side (today's behavior)
 * until the next `npm run deploy` prerenders it too. The default fallback
 * (Server) would try to reach a live SSR server that does not exist in this
 * deployment, so it must be overridden here.
 */
const PROJECT_ID = 'naan-builders';
const API_KEY = 'AIzaSyCs7vGCEkCJPashW45zfByehd3fheFKcFk';

async function getProjectIdParams(): Promise<Record<string, string>[]> {
  try {
    const url =
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
      `/databases/(default)/documents/projects?key=${API_KEY}&pageSize=300`;
    // A 15s cap so a blackholed connection makes `ng build` fail fast with a
    // clear error instead of appearing to hang (Node's default fetch/undici
    // timeout is far longer than anyone would wait for a build).
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      console.warn(`[app.routes.server] Firestore returned ${res.status} - no project pages will be prerendered this build.`);
      return [];
    }
    const body = (await res.json()) as { documents?: { name: string }[] };
    return (body.documents ?? []).map((doc) => ({ id: doc.name.split('/').pop()! }));
  } catch (err) {
    // Never fail the whole build over a transient network blip during
    // prerendering - an empty list just means no project pages are
    // prerendered this build (they still work via the Client fallback +
    // the firebase.json /projects/** rewrite to index.csr.html).
    console.warn('[app.routes.server] Failed to fetch project ids for prerendering - no project pages will be prerendered this build.', err);
    return [];
  }
}

export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/login', renderMode: RenderMode.Client },
  {
    path: 'projects/:id',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Client,
    getPrerenderParams: getProjectIdParams,
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
