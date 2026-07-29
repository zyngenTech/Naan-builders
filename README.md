# Nasar Construction — Civil Engineer Portfolio

A premium, animated, fully responsive portfolio + inquiry website for an
independent civil engineer / building contractor, built with **Angular 19**
(standalone components, signals, lazy-loaded routes) and **Firebase**
(Firestore + Storage + Hosting). No login, no backend server — visitors
browse freely and submit inquiries straight into Firestore.

## Tech Stack
- Angular 19 (standalone components, Signals, Reactive Forms, Router view transitions)
- Bootstrap 5 (grid/reset only — all visual design is custom CSS, no Tailwind)
- Firebase Firestore + Storage + Hosting (no Auth, no Node/Spring backend)
- Plain CSS with a shared design-token system in `src/styles.css`

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to https://console.firebase.google.com and create a project.
2. Enable **Firestore Database** (production mode) and **Storage**.
3. Register a Web App and copy the config object.
4. Paste that config into `src/environments/environment.ts` and
   `src/environments/environment.prod.ts` (replace the `firebase` block).
5. Update `contact.phone`, `contact.whatsapp`, `contact.email`, and
   `contact.address` in both environment files.

### 3. Seed sample content
Firestore starts empty, so pages will show friendly "no content yet"
placeholders. Use `scripts/seed-firestore.md` for ready-to-paste sample
documents for `settings`, `services`, `projects`, `gallery`, and
`testimonials`.

### 4. Run locally
```bash
npm start
```
Visit http://localhost:4200

### 5. Deploy
```bash
npm install -g firebase-tools   # once
firebase login
firebase init                  # select existing project, Firestore + Storage + Hosting
npm run deploy
```
`firebase.json`, `firestore.rules`, and `storage.rules` are already
included and configured for a public read-only site with a
public-write-only `inquiries` collection (see comments inside the rule
files for the exact security model).

## Firestore Collections
| Collection     | Purpose                                   | Client write access |
|----------------|--------------------------------------------|----------------------|
| `projects`     | Completed house projects                   | Read-only            |
| `gallery`      | Masonry gallery images/videos              | Read-only            |
| `services`     | Services list (Home + Services page)       | Read-only            |
| `testimonials` | Customer reviews                           | Read-only            |
| `settings`     | Single doc (`site`) — owner bio & stats    | Read-only            |
| `inquiries`    | Contact form submissions                   | **Create-only**       |

All content editing (projects, gallery, services, testimonials, settings)
is done directly from the Firebase Console — that's the "simple admin
management" requested, with zero custom admin UI or authentication to
maintain.

## Project Structure
```
src/app/
  core/
    models/      Interfaces for every Firestore document type
    services/    FirebaseService (generic Firestore/Storage wrapper) +
                 one thin domain service per collection + ToastService
  shared/
    components/  Navbar, Footer, Hero, Counter, ProjectCard, SectionTitle,
                 Loader, Toast, FloatingButtons, ScrollTop, ImageModal, VideoModal
  pages/         Home, About, Services, Projects, ProjectDetails, Gallery,
                 Testimonials, Contact — each lazy-loaded via app.routes.ts
```

## Notable Implementation Details
- **Logging & error handling**: every Firestore/Storage call in
  `FirebaseService` logs on start/success and `console.error`s on failure;
  domain services and page components layer their own `[ComponentName]`
  prefixed logs on top, and every `.subscribe()` has an `error` handler —
  nothing fails silently.
- **Reactive inquiry form**: full client-side validation (required, email
  pattern, phone pattern, min/max length) with inline error messages, a
  disabled/spinner state while submitting, and success/error toasts.
- **Performance**: `ChangeDetectionStrategy.OnPush` everywhere, all routes
  lazy-loaded with `loadComponent`, images use `loading="lazy"`.
- **Design**: dark charcoal + gold color system, glassmorphism cards,
  Playfair Display + Inter typography, scroll-reveal-ready utility classes,
  animated counters, masonry gallery with lightbox, auto-advancing
  testimonial slider, sticky navbar, floating WhatsApp/Call buttons,
  scroll-to-top button — fully responsive down to small mobile widths.

## What You Still Need to Supply
- Real photography (hero backgrounds referenced under `src/assets/images/`,
  project photos/videos uploaded to Storage).
- Your Firebase project config + contact details (see step 2 above).
- Actual project/service/testimonial content via the Firebase Console.
