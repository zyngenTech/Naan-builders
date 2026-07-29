/**
 * Represents one offered service, shown on the Home and Services pages.
 * Firestore collection: "services"
 */
export interface ServiceModel {
  id?: string;
  title: string;         // e.g. "Structural Design"
  description: string;
  icon: string;           // Font Awesome class, e.g. "fa-solid fa-drafting-compass"
  order?: number;          // Controls display order
}
