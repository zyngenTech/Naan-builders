/**
 * Represents a customer inquiry submitted through the Contact page form.
 * Firestore collection: "inquiries"
 */
export type InquiryStatus = 'new' | 'contacted' | 'closed';

export interface InquiryModel {
  id?: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  projectType: string;   // e.g. "New Construction", "Renovation", "Interior"
  budget: string;         // e.g. "20-30 Lakhs" - kept as a string range for simplicity
  message: string;
  status: InquiryStatus;
  createdDate: string;    // ISO date string
}
