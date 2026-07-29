# Sample Firestore Documents

Paste these directly into the Firebase Console (Firestore Database -> Start
collection) to see the site fully populated, or adapt them into a Node seed
script using `firebase-admin` if you prefer to automate it.

## Collection: settings (document id must be "site")
```json
{
  "ownerName": "Ramesh Kumar",
  "ownerTitle": "Civil Engineer & Building Contractor",
  "ownerPhoto": "https://your-storage-url/owner.jpg",
  "bio": "With over a decade of hands-on experience, I specialize in turning a family's vision into a safe, beautifully built home.",
  "yearsExperience": 10,
  "projectsCompleted": 35,
  "clientSatisfactionPercent": 100,
  "phone": "+91 90000 00000",
  "whatsapp": "919000000000",
  "email": "contact@rameshkumarconstruction.com",
  "address": "Chennai, Tamil Nadu, India",
  "certificates": []
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
{ "customerName": "Anitha & Suresh", "location": "Coimbatore", "rating": 5, "feedback": "Ramesh delivered exactly what he promised, on time and on budget.", "createdDate": "2024-04-10T00:00:00.000Z" }
```

## Collection: inquiries
Created automatically when a visitor submits the Contact form - no need to
seed this one manually.
