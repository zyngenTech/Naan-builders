# NaanBuilders — Civil Engineer Portfolio

A premium, animated, fully responsive portfolio + inquiry website for an
independent civil engineer / building contractor, built with **Angular 19**
(standalone components, signals, lazy-loaded routes) and **Firebase**
(Firestore + Storage + Hosting + Auth). Public pages need no login at all —
visitors browse freely and submit inquiries straight into Firestore. A single
password-protected **Admin Dashboard** (`/admin`) lets the owner manage every
piece of content — projects (with photos & videos), the gallery, services,
testimonials, the About page's Journey timeline, and site-wide settings
(company name, stats, contact info, home banner) — without ever opening the
Firebase Console. The admin area renders its own separate shell (no public
navbar/footer) and there is no visible link to it anywhere on the public
site - it's reached only by typing `/admin` directly.

## Tech Stack
- Angular 19 (standalone components, Signals, Reactive Forms, Router view transitions)
- Bootstrap 5 (grid/reset only — all visual design is custom CSS, no Tailwind)
- Firebase Firestore + Storage + Hosting + Authentication (email/password, admin-only) - via the plain Firebase SDK directly (no AngularFire dependency)
- Plain CSS with a shared design-token system in `src/styles.css`

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to https://console.firebase.google.com and create a project.
2. Enable **Firestore Database** (production mode), **Storage**, and
   **Authentication -> Sign-in method -> Email/Password**.
3. Register a Web App and copy the config object.
4. Paste that config into `src/environments/environment.ts` and
   `src/environments/environment.prod.ts` (replace the `firebase` block).
5. Update the `contact` block (phone/whatsapp/email/address) in both
   environment files — these are just the initial fallback values; once
   the Admin dashboard is used, Firestore values take over everywhere.

### 3. Create the admin account
There is no public sign-up screen by design. In the Firebase Console, go to
**Authentication -> Users -> Add user** and create one email/password login
for yourself. That's the only account that can reach `/admin`.

### 4. Seed sample content (optional but recommended)
Firestore starts empty, so pages will show friendly "no content yet"
placeholders. Use `scripts/seed-firestore.md` for ready-to-paste sample
documents for `settings`, `services`, `projects`, `gallery`, and
`testimonials` — or just log into `/admin` and add everything from there.

### 5. Run locally
```bash
npm start
```
Visit http://localhost:4200 for the public site, or http://localhost:4200/admin/login to sign in to the dashboard.

### 6. Deploy
```bash
npm install -g firebase-tools   # once
firebase login
firebase init                  # select existing project, Firestore + Storage + Hosting
npm run deploy
```
`firebase.json`, `firestore.rules`, and `storage.rules` are already
included and configured for a public read-only site where only the signed-in
admin account can write to `projects`, `gallery`, `services`, `testimonials`,
and `settings` — and where any visitor can create (but never read/edit) an
`inquiries` document (see comments inside the rule files for the exact
security model).

## Admin Dashboard (`/admin`)
There is no visible link to the dashboard anywhere on the public site by
design — go to `/admin/login` directly. After signing in, the dashboard has
seven tabs, laid out as two-column ("col-6" style) forms and lists that stay
compact and usable on a phone:

| Tab                    | What it manages                                                                 |
|-------------------------|----------------------------------------------------------------------------------|
| **Home Banner & Stats** | Company name, logo (shown as a circle across the site), favicon, home page banner image *or* uploaded video (video wins if both are set), a separate header banner image for every other page (About/Services/Projects/Gallery/Testimonials/Contact), the social share preview image, the Projects/Satisfaction/Years/Cities stat strip, owner bio/photo, and **all contact info** (phone, WhatsApp, email, address) used across the Navbar, Footer, floating buttons, and Contact page. |
| **Inquiries**           | Every Contact form submission, with full customer details (name, phone, email, location, project type, budget, message). Filter by status, mark new/contacted/closed, reply on WhatsApp in one tap, or delete. A red badge on the tab shows the count of new (unread) inquiries. |
| **Projects**            | Full CRUD — cover photo, unlimited gallery photos, unlimited project videos, description, location, completion date, area, type, and a "featured on homepage" toggle. |
| **Gallery**              | Add/delete masonry gallery photos or videos with an optional caption.           |
| **Services**            | Add/edit/delete the service cards shown on Home and the Services page.          |
| **Testimonials**        | Add/edit/delete customer reviews with rating and optional photo.                |
| **Journey**             | Add/edit/delete the "Milestones Over the Years" timeline on the About page (e.g. starting from your company's founding year). |

Every photo/video field supports **either** uploading a file (with a live
progress bar, stored in Firebase Storage) **or** pasting an already-hosted
URL directly — only the resulting URL is written to Firestore either way.
If a photo or video ever fails to load, the site shows a themed placeholder
instead of a broken image/video, so nothing ever looks broken.

## Customer Inquiry Flow
The Contact page form follows a strict, deliberate order on submit:
1. Validate the form client-side.
2. Save the inquiry to Firestore **first**.
3. Only if that save succeeds: show a success toast, then open WhatsApp
   (in a new tab) with a message pre-filled with the inquiry details, to
   the admin's WhatsApp number.
4. If the Firestore save fails for any reason: WhatsApp is **never**
   opened, an error toast is shown, and the error is logged to the
   console.

This order is intentional — the inquiry always exists in Firestore even
if the customer closes the WhatsApp tab or decides not to send that
message, so a lead is never lost just because WhatsApp didn't open.

## Firestore Collections
| Collection     | Purpose                                   | Client write access |
|----------------|--------------------------------------------|----------------------|
| `projects`     | Completed house projects                   | Admin only (signed in) |
| `gallery`      | Masonry gallery images/videos              | Admin only (signed in) |
| `services`     | Services list (Home + Services page)       | Admin only (signed in) |
| `testimonials` | Customer reviews                           | Admin only (signed in) |
| `milestones`   | About page "Journey" timeline               | Admin only (signed in) |
| `settings`     | Single doc (`site`) — company name, stats, contact info, hero banner, owner bio | Admin only (signed in) |
| `inquiries`    | Contact form submissions                   | Create-only for visitors, read/edit for admin only |

Everything above can be managed entirely from `/admin` — the Firebase
Console is only needed for the one-time setup in step 2-3 above (enabling
services and creating the admin account).

## Project Structure
```
src/app/
  core/
    models/      Interfaces for every Firestore document type
    services/    FirebaseService (generic Firestore/Storage wrapper),
                 AuthService, one thin domain service per collection
                 (including MilestoneService), ToastService
    guards/      adminAuthGuard - protects the /admin route
  shared/
    components/  Navbar, Footer, Hero (image or video banner), Counter,
                 ProjectCard, SectionTitle, Loader, Toast, FloatingButtons,
                 ScrollTop, ImageModal, VideoModal, AppLoader (branded
                 loading modal), AdminUpload, AdminMultiUpload (both
                 support file upload OR pasting a URL - shared by every
                 admin CRUD form)
    directives/  ImgFallbackDirective - swaps a broken <img> for an
                 on-brand placeholder instead of the browser's broken-
                 image icon
  pages/         Home, About, Services, Projects, ProjectDetails, Gallery,
                 Testimonials, Contact — public, lazy-loaded, no login
    admin/       AdminLogin (public), AdminDashboard (guarded) with six
                 tab components under admin/components/ - both render
                 their own shell only; AppComponent hides the public
                 Navbar/Footer/floating buttons on any /admin route
```

## Notable Implementation Details
- **No dummy data**: every page reads directly from Firestore with no
  hardcoded placeholder content (company name, bio, stats, services,
  testimonials, milestones). If a collection is empty, the page shows a
  plain "add this from Admin" message instead of fake content, and while
  the initial fetch is in flight it shows a loading state rather than any
  placeholder text.
- **Loading modal**: a branded full-screen `AppLoaderComponent` shows on
  every hard reload and route change (`app.component.ts` listens to
  Router navigation events), so there's never a blank flash while a page
  or its data loads.
- **Broken media fallback**: `ImgFallbackDirective` (`appImgFallback` on
  any `<img>`) swaps a failed image for an on-brand placeholder graphic;
  the Hero banner layers its image as a base layer with the video on top,
  so if an uploaded banner video fails to play, the image underneath
  still shows instead of a blank/broken banner.
- **Logging & error handling**: every Firestore/Storage call in
  `FirebaseService` logs on start/success and `console.error`s on failure;
  domain services and page components layer their own `[ComponentName]`
  prefixed logs on top, and every `.subscribe()` has an `error` handler —
  nothing fails silently.
- **Reactive inquiry form**: full client-side validation (required, email
  pattern, phone pattern, min/max length) with inline error messages, a
  disabled/spinner state while submitting, and success/error toasts.
- **Admin auth & separation**: `adminAuthGuard` reads live Firebase auth
  state (works correctly even on a hard refresh of `/admin`) and redirects
  to `/admin/login` when signed out. There's no public sign-up route and
  no visible link to `/admin` anywhere on the public site. `/admin` and
  `/admin/login` render entirely their own shell — `AppComponent` hides
  the public Navbar/Footer/floating buttons/scroll-to-top on any route
  starting with `/admin`.
- **Admin mobile layout**: forms and lists across every manager use a
  shared `.admin-form-grid` utility (two equal columns, "col-6" style) that
  stays two-up even on small phones rather than collapsing to one column,
  since the dashboard is expected to be used mostly on mobile.
- **Performance**: `ChangeDetectionStrategy.OnPush` everywhere, all routes
  lazy-loaded with `loadComponent`, images use `loading="lazy"`, and the
  featured-projects query avoids needing a Firestore composite index by
  filtering server-side and sorting client-side.
- **Design**: dark charcoal + gold color system, glassmorphism cards,
  Playfair Display + Inter typography, scroll-reveal-ready utility classes,
  animated counters, masonry gallery with lightbox, auto-advancing
  testimonial slider, sticky navbar, floating WhatsApp/Call buttons,
  scroll-to-top button — fully responsive down to small mobile widths.

## What You Still Need to Supply
- Real photography — every page banner, the owner photo, and the social
  share image can be set from Admin (upload or paste a URL); the files
  under `src/assets/images/` are optional fallbacks only (see the README
  in that folder).
- Your Firebase project config (see step 2 above).
- The one admin login (see step 3), then everything else — company name,
  contact details, stats, projects, services, testimonials, milestones,
  gallery — is entered through `/admin`, no Firebase Console or code
  changes needed.

## SEO / Deployment (`robots.txt` + `sitemap.xml`)
The site is set up for `https://naan-builders.web.app` - if you deploy to
a different domain, update the URLs in `src/robots.txt`, `src/sitemap.xml`,
and the canonical/`og:url`/`og:image` tags in `src/index.html` to match.

- `src/robots.txt` and `src/sitemap.xml` are registered directly in
  `angular.json`'s `assets` array, so they're copied to the root of the
  build output (next to `index.html`) - not into `/assets/`.
- Firebase Hosting serves an exactly-matching static file before it ever
  applies the SPA catch-all rewrite in `firebase.json`, so
  `/robots.txt` and `/sitemap.xml` are served as real files automatically
  - no extra hosting config needed.
- **Known limitation**: `sitemap.xml` only lists the static pages (Home,
  About, Services, Projects, Gallery, Testimonials, Contact). Individual
  project detail pages (`/projects/<id>`) are generated from whatever is
  in Firestore at runtime, so they can't be listed in a static file build
  ahead of time. If you want those included too, the proper fix is a
  small script (or Cloud Function) that regenerates `sitemap.xml` from
  the `projects` collection at deploy time - out of scope here, but a
  reasonable next step if project-level SEO matters to you.
