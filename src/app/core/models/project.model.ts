/**
 * Represents a completed (or ongoing) construction project shown in the
 * portfolio, project-details, and gallery pages.
 * Firestore collection: "projects"
 */
export interface ProjectModel {
  id?: string;                 // Firestore document id (populated after fetch)
  title: string;                // e.g. "Sri Lakshmi Residence"
  description: string;          // Short summary shown on the card
  fullDescription?: string;     // Long-form description for the details page
  location: string;             // e.g. "Coimbatore, Tamil Nadu"
  completedDate: string;        // ISO date string, e.g. "2024-03-15"
  coverImage: string;           // Storage download URL for the hero/thumbnail image
  gallery: string[];            // Storage download URLs for additional images
  videos?: string[];            // Storage download URLs / YouTube links for videos
  materialsUsed?: string[];     // e.g. ["RCC Framework", "Italian Marble Flooring"]
  constructionStages?: ProjectStage[];
  areaSqft?: number;            // Built-up area
  projectType?: string;         // e.g. "Independent House", "Duplex", "Renovation"
  featured: boolean;            // Shown in "Latest Projects" on Home
  createdDate: string;          // ISO date string - when the record was created
}

export interface ProjectStage {
  stageName: string;   // e.g. "Foundation", "Roofing", "Finishing"
  image?: string;
  description?: string;
}
