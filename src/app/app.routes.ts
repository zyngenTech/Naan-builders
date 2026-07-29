import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Top-level route table. Every page is lazy-loaded (loadComponent) so the
 * initial bundle only contains the shell (navbar/footer/floating buttons).
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Ramesh Kumar | Civil Engineer & Building Contractor',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'About | Ramesh Kumar Construction',
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.component').then((m) => m.ServicesComponent),
    title: 'Services | Ramesh Kumar Construction',
  },
  {
    path: 'projects',
    loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
    title: 'Completed Projects | Ramesh Kumar Construction',
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('./pages/project-details/project-details.component').then((m) => m.ProjectDetailsComponent),
    title: 'Project Details | Ramesh Kumar Construction',
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent),
    title: 'Gallery | Ramesh Kumar Construction',
  },
  {
    path: 'testimonials',
    loadComponent: () =>
      import('./pages/testimonials/testimonials.component').then((m) => m.TestimonialsComponent),
    title: 'Testimonials | Ramesh Kumar Construction',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact & Inquiry | Ramesh Kumar Construction',
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Admin Sign In | Ramesh Kumar Construction',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [authGuard],
    title: 'Admin Dashboard | Ramesh Kumar Construction',
  },
  { path: '**', redirectTo: '' },
];
