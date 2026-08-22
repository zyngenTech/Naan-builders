/**
 * Sitemap generator  —  run before every deploy.
 *
 *   node scripts/generate-sitemap.mjs
 *
 * WHY: src/sitemap.xml was handwritten and listed only the 7 static
 * routes. Every /projects/:id page - the pages most likely to actually
 * rank, because they have unique photos and copy - was invisible to
 * search engines. This reads the live "projects" collection and writes a
 * sitemap that includes them, with <lastmod> taken from each project's
 * completedDate.
 *
 * It reads Firestore over the public REST API using the same public web
 * API key the browser uses. The "projects" collection is already
 * world-readable (see firestore.rules), so no service account, no admin
 * SDK, and no secret is involved.
 *
 * WHEN YOUR CUSTOM DOMAIN GOES LIVE: change SITE_URL below (it must match
 * environment.siteUrl and the canonical/og:url in src/index.html).
 */
import { writeFileSync } from 'node:fs';

const SITE_URL = 'https://naanbuilders.in'; // no trailing slash
const PROJECT_ID = 'naan-builders';
const API_KEY = 'AIzaSyCs7vGCEkCJPashW45zfByehd3fheFKcFk';
const OUT = 'src/sitemap.xml';

/** Static routes. /admin and /admin/login are deliberately absent - they must never be indexed. */
const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/services', changefreq: 'monthly', priority: '0.8' },
  { path: '/projects', changefreq: 'weekly', priority: '0.9' },
  { path: '/gallery', changefreq: 'weekly', priority: '0.7' },
  { path: '/testimonials', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
];

const iso = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function fetchProjects() {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/projects?key=${API_KEY}&pageSize=300`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firestore returned ${res.status} ${res.statusText}`);

  const body = await res.json();
  return (body.documents || []).map((doc) => ({
    id: doc.name.split('/').pop(),
    completedDate: doc.fields?.completedDate?.stringValue || doc.updateTime,
  }));
}

function buildSitemap(projects) {
  const urls = [
    ...STATIC_ROUTES.map((r) => ({ loc: SITE_URL + r.path, changefreq: r.changefreq, priority: r.priority, lastmod: null })),
    ...projects.map((p) => ({
      loc: `${SITE_URL}/projects/${p.id}`,
      changefreq: 'yearly',
      priority: '0.6',
      lastmod: iso(p.completedDate),
    })),
  ];

  const body = urls
    .map((u) => {
      const lines = [`    <loc>${xmlEscape(u.loc)}</loc>`];
      if (u.lastmod) lines.push(`    <lastmod>${u.lastmod}</lastmod>`);
      lines.push(`    <changefreq>${u.changefreq}</changefreq>`);
      lines.push(`    <priority>${u.priority}</priority>`);
      return `  <url>\n${lines.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

try {
  const projects = await fetchProjects();
  writeFileSync(OUT, buildSitemap(projects), 'utf8');
  console.log(`✅ ${OUT} written`);
  console.log(`   ${STATIC_ROUTES.length} static routes + ${projects.length} project pages = ${STATIC_ROUTES.length + projects.length} URLs`);
  if (!projects.length) {
    console.warn('   ⚠ No projects returned. Check the collection name and that firestore.rules allows public read.');
  }
} catch (err) {
  // Deliberately exits 0. This script runs as part of `npm run build`, and
  // a transient network blip must not block a production deploy. The
  // previous src/sitemap.xml is left in place, so the worst case is a
  // slightly stale sitemap rather than a failed release.
  console.warn('⚠  Sitemap generation failed:', err.message);
  console.warn('   Existing src/sitemap.xml left untouched - build continues.');
}
