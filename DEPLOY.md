# Deploy guide — NaanBuilders

Everything here is done from the project folder on your machine.

---

## 1. First-time setup (once)

```bash
npm install
npm install -D fontawesome-subset @fortawesome/fontawesome-free
```

---

## 2. Normal deploy (every time)

```bash
npm run deploy
```

That single command runs three steps: regenerate the sitemap from live
Firestore data → build for production → deploy to Firebase Hosting.

If you want them separately:

```bash
npm run sitemap    # rebuild src/sitemap.xml from the projects collection
npm run build      # sitemap + production build
firebase deploy    # push to hosting
```

Rules are deployed with the same command. To push only rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## 3. Font Awesome subset — do this once, it is the biggest speed win left

Font Awesome currently downloads **269 KB of font files — 46% of your
entire page** — to draw 57 icons. Lighthouse shows both files downloading
at high priority while the hero image is waiting, which is the main thing
holding your LCP at 5 seconds.

```bash
npm run fa:subset
ls -l src/assets/fonts/fa
```

Expect roughly 10–15 KB total instead of 269 KB. Send me that `ls` output
and I will wire the CSS and `index.html` to use the local files. Icons do
not change — same font, same glyphs, same class names, no template edits.

---

## 4. When your custom domain goes live

Add the domain in **Firebase Console → Hosting → Add custom domain**, then
change the URL in these four places. They must all match, with **no
trailing slash**:

| File | What to change |
|---|---|
| `src/environments/environment.ts` | `siteUrl` |
| `src/environments/environment.prod.ts` | `siteUrl` |
| `src/index.html` | `<link rel="canonical">` and `og:url` |
| `scripts/generate-sitemap.mjs` | `SITE_URL` |

Then `npm run deploy`. The sitemap regenerates with the new domain
automatically.

After that:

1. **Google Search Console** → add the property → submit
   `https://yourdomain.com/sitemap.xml`.
2. Set the old `naan-builders.web.app` as a redirect to the new domain so
   you don't split your search ranking across two addresses.

---

## 5. Security

Already configured in `firebase.json`, applied on every response:

- **HSTS** — forces HTTPS for 2 years
- **X-Content-Type-Options: nosniff** — stops MIME-type guessing
- **X-Frame-Options: DENY** — nobody can put your admin login in an iframe
- **Referrer-Policy** — full URL to you, origin only to third parties
- **Permissions-Policy** — camera, mic, location, payment all denied

**Content-Security-Policy is in report-only mode on purpose.** It logs
violations to the browser console and blocks nothing, so it cannot break
your site. Browse the whole site including admin for a week with devtools
open. Once the console is quiet, rename the header in `firebase.json` from
`Content-Security-Policy-Report-Only` to `Content-Security-Policy` to
start enforcing it. Turning it on blind would very likely break Cloudinary
images, Firestore, Google Fonts or Font Awesome.

One thing to do in the Google Cloud Console: **restrict the Firebase API
key** to your domains. Credentials → your browser key → Application
restrictions → HTTP referrers → add `yourdomain.com/*` and
`naan-builders.web.app/*`. The key is public by design (it ships in the
JS bundle, as every Firebase web app does) and your Firestore rules are
the real security boundary — but referrer restrictions stop it being used
from someone else's site.

---

## 6. Post-deploy checks

- [ ] Home, About, Services, Projects, a single project, Gallery,
      Testimonials, Contact all load
- [ ] Submit the contact form → check the inquiry appears in Admin
- [ ] Admin login → edit each tab → confirm changes appear on the public site
- [ ] Upload an image in Admin → confirm it displays
- [ ] `view-source:` on a project page → title and description are that
      project's, not the homepage's
- [ ] `yourdomain.com/sitemap.xml` lists your project pages
- [ ] `yourdomain.com/robots.txt` still disallows `/admin`
- [ ] Lighthouse **in an incognito window** (stored data skews the score)

---

## 7. Known remaining work

| Item | Impact | Status |
|---|---|---|
| Font Awesome subset | 269 KB → ~7 KB, self-hosted, removed cdnjs from the critical path and from CSP | ✅ Done (2026-08-17) |
| Firebase Storage not provisioned | Admin photo/video upload (`StorageService`) cannot work until this is set up | **Action needed** — see below |
| Prerendering (SSG) | Only way to get mobile LCP meaningfully under ~2.5s and give social previews real per-page titles | Declined for now — real change, discussed and deferred |

### Firebase Storage needs one-time manual setup

`firebase deploy` fails on the `storage` target with:

"Firebase Storage has not been set up on project 'naan-builders'."

This is a one-time console action, not something the CLI or a script can
do safely on your behalf — it requires picking a bucket region, which is
effectively permanent. Go to
https://console.firebase.google.com/project/naan-builders/storage, click
"Get Started", pick a region close to your users (e.g. `asia-south1` for
India), and confirm. After that, `firebase deploy --only storage` will
succeed and Admin image/video uploads will work. Until then, deploys use
`firebase deploy --only hosting,firestore` to skip the storage target.

Prerendering: this app is client-side rendered, so nothing paints until
the JS bundle boots and Angular renders — on Lighthouse's simulated
mobile CPU throttle that "render delay" is ~88% of LCP time. Prerendering
(build-time static HTML per route + client hydration) is the only fix,
but it changes real behavior (a build-time content snapshot shows briefly
before hydrating to live Firestore data) and deployment shape. Revisit if
mobile performance needs to go higher than the current 70-76 score.
