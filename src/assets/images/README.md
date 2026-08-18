# Images Folder

This folder deliberately contains almost nothing. Every banner image on
the site (Home, About, Services, Projects, Gallery, Testimonials, Contact)
and the owner photo are set entirely from the **Admin dashboard**
(`/admin` -> Home Banner & Stats), either by uploading a file or pasting a
URL - there are no bundled placeholder image files for them.

**If no image has been set yet for a page**, the site shows a pure CSS
"design" background instead - a black/gold gradient with a centered icon,
generated entirely with CSS (see `HeroComponent` / `.hero__design`, and
`.about-intro__photo-design` on the About page). No image file is loaded
or requested, so there's nothing to 404 and nothing to ship.

## og-cover.jpg (the one exception)
This single file remains because the social-share preview image
(`og:image` meta tag) has to be a real static image file - social
crawlers (WhatsApp, Facebook, etc.) read `index.html`'s meta tags directly
without running any JavaScript, so it can't be a CSS design. Admin's
"Social Share Image" field overrides it once JS has loaded, but most
crawlers won't see that - replace `og-cover.jpg` directly with your own
1200x630 image if you want the static default to be different.

## If an image URL ever fails to load
Whether it's a broken Storage file or a bad pasted link, the site never
shows a broken-image icon - `ImgFallbackDirective` swaps it for a themed
placeholder automatically.
