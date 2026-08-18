# Sample Firestore Documents

Everything below can also be added directly from the **Admin dashboard**
(`/admin` after logging in) - this file is only useful if you'd rather
paste sample data straight into the Firebase Console (Firestore Database ->
Start collection) to see the site populated before setting up Admin.

## Collection: settings (document id must be "site")
```json
{
  "companyName": "NaanBuilders",
  "ownerName": "Your Name",
  "ownerTitle": "Civil Engineer & Building Contractor",
  "ownerPhoto": "https://your-storage-url/owner.jpg",
  "bio": "Write a short bio about your experience and approach to construction.",
  "yearsExperience": 10,
  "projectsCompleted": 35,
  "clientSatisfactionPercent": 100,
  "citiesServed": 20,
  "phone": "+91 90000 00000",
  "whatsapp": "919000000000",
  "email": "contact@naanbuilders.com",
  "address": "Chennai, Tamil Nadu, India",
  "certificates": [],
  "heroImage": "https://your-storage-url/hero-home.jpg",
  "heroVideo": ""
}
```

## Collection: services (auto-id)
```json
{ "title": "House Construction", "description": "End-to-end residential construction from foundation to finishing.", "icon": "fa-solid fa-house-chimney", "order": 1 }
```
Repeat for: Building Planning, Structural Design, Renovation, Interior Coordination, Construction Supervision.

## Collection: projects (auto-id)
```json
{
  "title": "Sri Lakshmi Residence",
  "description": "A modern 3BHK independent house with a courtyard-facing living room.",
  "fullDescription": "Full-length description for the project details page...",
  "location": "Coimbatore, Tamil Nadu",
  "completedDate": "2024-03-15",
  "coverImage": "https://your-storage-url/project1/cover.jpg",
  "gallery": ["https://your-storage-url/project1/1.jpg", "https://your-storage-url/project1/2.jpg"],
  "videos": [],
  "materialsUsed": ["RCC Framework", "Italian Marble Flooring", "UPVC Windows"],
  "constructionStages": [
    { "stageName": "Foundation", "image": "https://your-storage-url/project1/foundation.jpg", "description": "Deep RCC foundation for soil stability." }
  ],
  "areaSqft": 2200,
  "projectType": "Independent House",
  "featured": true,
  "createdDate": "2024-03-20T00:00:00.000Z"
}
```

## Collection: gallery (auto-id)
```json
{ "type": "image", "url": "https://your-storage-url/gallery/1.jpg", "caption": "Living room finishing", "createdDate": "2024-04-01T00:00:00.000Z" }
```

## Collection: testimonials (auto-id)
```json
{ "customerName": "A happy customer", "location": "Coimbatore", "rating": 5, "feedback": "Write the customer's actual feedback here.", "createdDate": "2024-04-10T00:00:00.000Z" }
```

## Collection: milestones (auto-id)
Shown on the About page's "Journey / Milestones Over the Years" timeline.
```json
{ "year": "2006", "title": "Founded NaanBuilders", "description": "Started offering structural design & site supervision.", "order": 1 }
```
Add more documents for each later milestone, increasing `order` each time.

## Collection: inquiries
Created automatically when a visitor submits the Contact form - no need to
seed this one manually.

## Firebase Authentication
Go to Authentication -> Users -> Add user and create one email/password
account. That's the only login that can reach `/admin`. There is no link
to `/admin` anywhere on the public site - it's reached only by typing the
URL directly.
