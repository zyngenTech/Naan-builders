import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/auth.guard';

/**
 * Top-level route table. Every page is lazy-loaded (loadComponent) so the
 * initial bundle only contains the shell (navbar/footer/floating buttons).
 * The /admin dashboard is protected by adminAuthGuard; /admin/login is public.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'NaanBuilders | Civil Engineer & Building Contractor',
    data: { description: 'Independent civil engineer and building contractor in Chennai. Residential construction from structural design and approvals through to handover. See our completed homes and request a free consultation.' },
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'About | NaanBuilders',
    data: { description: 'Meet the civil engineer behind NaanBuilders - our background, our approach to residential construction, and the milestones along the way.' },
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
    title: 'Services | NaanBuilders',
    data: { description: 'Construction services from NaanBuilders: new home construction, renovation, structural design, approvals and estimates, and interior coordination.' },
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
    title: 'Completed Projects | NaanBuilders',
    data: { description: 'Browse completed residential construction projects by NaanBuilders - house builds across Tamil Nadu with photos, materials and build stages.' },
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('./pages/project-details/project-details.component').then((m) => m.ProjectDetailsComponent),
    title: 'Project Details | NaanBuilders',
    data: { description: 'Detailed look at a completed NaanBuilders home - construction stages, materials used, photos and project specifications.' },
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent),
    title: 'Gallery | NaanBuilders',
    data: { description: 'Photo and video gallery of NaanBuilders construction work - site progress, finished homes, and interior detailing.' },
  },
  {
    path: 'testimonials',
    loadComponent: () =>
      import('./pages/testimonials/testimonials.component').then((m) => m.TestimonialsComponent),
    title: 'Testimonials | NaanBuilders',
    data: { description: 'What our clients say about building their homes with NaanBuilders - reviews from families we have built for.' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact & Inquiry | NaanBuilders',
    data: { description: 'Contact NaanBuilders for a free construction consultation. Share your plot, budget and requirements and we will get back to you.' },
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Admin Login | NaanBuilders',
    data: { description: 'Administrator sign-in.', noIndex: true },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [adminAuthGuard],
    title: 'Admin Dashboard | NaanBuilders',
    data: { description: 'Administrator dashboard.', noIndex: true },
  },
  { path: '**', redirectTo: '' },
];
