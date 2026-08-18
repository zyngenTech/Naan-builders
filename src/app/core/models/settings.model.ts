/**
 * Site-wide settings, editable from the Admin dashboard (or directly in
 * Firestore). Firestore collection: "settings", single document with id "site".
 */
export interface SiteSettingsModel {
  companyName: string;
  ownerName: string;
  ownerTitle: string;
  ownerPhoto?: string;
  bio: string;

  // Navbar/Footer/Admin brand. If unset, a Font Awesome icon is shown
  // instead - see LogoComponent. faviconUrl updates the browser tab icon
  // at runtime once loaded; the static favicon.ico is the fallback shown
  // before that (and for crawlers that don't run JS).
  logoUrl?: string;
  faviconUrl?: string;

  // Home page stat strip - all editable from Admin.
  yearsExperience: number;
  projectsCompleted: number;
  clientSatisfactionPercent: number;
  citiesServed: number;

  // Contact details, used across Navbar/Footer/Contact/Floating buttons.
  phone: string;
  whatsapp: string;
  email: string;
  address: string;

  certificates?: string[];

  // Home page hero banner. If heroVideo is set it plays as the banner
  // background (looping, muted); otherwise heroImage is used.
  heroImage?: string;
  heroVideo?: string;

  // Interior page header banners (About/Services/Projects/Gallery/
  // Testimonials/Contact) - each editable independently from Admin. If
  // unset, HeroComponent renders a pure CSS black/gold design instead of
  // any image file.
  heroImageAbout?: string;
  heroImageServices?: string;
  heroImageProjects?: string;
  heroImageGallery?: string;
  heroImageTestimonials?: string;
  heroImageContact?: string;

  // Social share preview image (og:image meta tag).
  ogImage?: string;
}
