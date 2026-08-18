/**
 * A single entry in the About page's "Journey / Milestones Over the
 * Years" timeline. Firestore collection: "milestones".
 */
export interface MilestoneModel {
  id?: string;
  year: string;         // e.g. "2006"
  title: string;         // e.g. "Started Independent Practice"
  description: string;
  order?: number;         // Controls display order (ascending)
}
