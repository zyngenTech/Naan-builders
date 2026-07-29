/**
 * Represents a customer testimonial/review.
 * Firestore collection: "testimonials"
 */
export interface TestimonialModel {
  id?: string;
  customerName: string;
  location?: string;
  rating: number;        // 1-5
  feedback: string;
  photoUrl?: string;
  projectId?: string;    // Optional link back to the related project
  createdDate: string;
}
