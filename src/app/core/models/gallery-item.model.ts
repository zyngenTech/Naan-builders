/**
 * Represents a single masonry gallery entry (image or video).
 * Firestore collection: "gallery"
 */
export interface GalleryItemModel {
  id?: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;   // For videos, a poster frame
  caption?: string;
  projectId?: string;
  createdDate: string;
}
