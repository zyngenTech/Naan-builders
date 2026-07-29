/**
 * Site-wide settings, editable directly in Firestore without a redeploy.
 * Firestore collection: "settings", single document with id "site".
 */
export interface SiteSettingsModel {
  /** Website/brand name shown in the navbar, footer, and browser tab title. */
  siteName: string;
  /** Storage download URL for the navbar/footer logo image. */
  logoUrl?: string;
  /** Storage download URL for the browser tab favicon. */
  faviconUrl?: string;
  ownerName: string;
  ownerTitle: string;
  ownerPhoto?: string;
  bio: string;
  yearsExperience: number;
  projectsCompleted: number;
  clientSatisfactionPercent: number;
  citiesServed: number;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  certificates?: string[];
  /** Storage download URL for a video played as the home hero banner background (admin-uploaded). */
  heroVideoUrl?: string;
  /** Storage download URL for a custom hero banner image (falls back to the default asset if unset). */
  heroImageUrl?: string;
  /** Homepage hero text (the small eyebrow line, big headline, and subheading). */
  homeHeroEyebrow?: string;
  homeHeroTitle?: string;
  homeHeroSubtitle?: string;
  /** Short line shown under the brand name in the footer. */
  footerTagline?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
}
