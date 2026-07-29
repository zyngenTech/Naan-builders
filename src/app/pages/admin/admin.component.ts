import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { SettingsService } from '../../core/services/settings.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { ToastService } from '../../core/services/toast.service';
import { TestimonialService } from '../../core/services/testimonial.service';
import { ServiceOfferingService } from '../../core/services/service.service';
import { GalleryService } from '../../core/services/gallery.service';

import { ProjectModel } from '../../core/models/project.model';
import { TestimonialModel } from '../../core/models/testimonial.model';
import { ServiceModel } from '../../core/models/service.model';
import { GalleryItemModel } from '../../core/models/gallery-item.model';

type AdminTab = 'projects' | 'testimonials' | 'services' | 'gallery' | 'site' | 'hero';

/**
 * AdminComponent
 * Single-page admin dashboard (tabbed, not routed further) so the whole
 * back-office fits on one mobile screen without extra navigation.
 *
 * Tabs:
 *  - Projects: full CRUD, with cover image / gallery images / video upload.
 *  - Testimonials: full CRUD for customer reviews shown on Home + Testimonials page.
 *  - Services: full CRUD for the service offerings shown on Home + Services page.
 *  - Gallery: full CRUD for the photo/video gallery.
 *  - Site Info: branding, owner bio + photo, homepage hero text, stats, contact, footer.
 *  - Hero Banner: upload a video (or image) played behind the homepage hero.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoaderComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private projectService = inject(ProjectService);
  private settingsService = inject(SettingsService);
  private firebaseService = inject(FirebaseService);
  private toastService = inject(ToastService);
  private testimonialService = inject(TestimonialService);
  private serviceOfferingService = inject(ServiceOfferingService);
  private galleryService = inject(GalleryService);
  private router = inject(Router);

  readonly activeTab = signal<AdminTab>('projects');
  readonly currentUserEmail = this.authService.currentUser()?.email ?? '';

  // ---------------------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------------------
  readonly projects = signal<ProjectModel[]>([]);
  readonly isLoadingProjects = signal(true);
  readonly showProjectForm = signal(false);
  readonly editingProjectId = signal<string | null>(null);
  readonly isSavingProject = signal(false);

  readonly coverImageUrl = signal('');
  readonly galleryUrls = signal<string[]>([]);
  readonly videoUrls = signal<string[]>([]);
  readonly isUploadingCover = signal(false);
  readonly isUploadingGallery = signal(false);
  readonly isUploadingVideo = signal(false);

  readonly projectTypes = ['Independent House', 'Duplex', 'Apartment', 'Renovation', 'Commercial', 'Other'];

  readonly projectForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(220)]],
    fullDescription: [''],
    location: ['', [Validators.required]],
    completedDate: ['', [Validators.required]],
    projectType: ['Independent House', [Validators.required]],
    areaSqft: [0],
    featured: [false],
  });

  // ---------------------------------------------------------------------
  // TESTIMONIALS
  // ---------------------------------------------------------------------
  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly isLoadingTestimonials = signal(true);
  readonly showTestimonialForm = signal(false);
  readonly editingTestimonialId = signal<string | null>(null);
  readonly isSavingTestimonial = signal(false);
  readonly testimonialPhotoUrl = signal('');
  readonly isUploadingTestimonialPhoto = signal(false);

  readonly testimonialForm = this.fb.nonNullable.group({
    customerName: ['', [Validators.required]],
    location: [''],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    feedback: ['', [Validators.required, Validators.maxLength(400)]],
  });

  // ---------------------------------------------------------------------
  // SERVICES
  // ---------------------------------------------------------------------
  readonly services = signal<ServiceModel[]>([]);
  readonly isLoadingServices = signal(true);
  readonly showServiceForm = signal(false);
  readonly editingServiceId = signal<string | null>(null);
  readonly isSavingService = signal(false);

  readonly serviceForm = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    icon: ['fa-solid fa-drafting-compass', [Validators.required]],
    order: [0],
  });

  // ---------------------------------------------------------------------
  // GALLERY
  // ---------------------------------------------------------------------
  readonly galleryItems = signal<GalleryItemModel[]>([]);
  readonly isLoadingGallery = signal(true);
  readonly showGalleryForm = signal(false);
  readonly isSavingGalleryItem = signal(false);
  readonly galleryUploadUrl = signal('');
  readonly isUploadingGalleryFile = signal(false);

  readonly galleryForm = this.fb.nonNullable.group({
    type: ['image' as 'image' | 'video', [Validators.required]],
    caption: [''],
  });

  // ---------------------------------------------------------------------
  // SITE INFO (branding + owner + homepage hero text + stats + contact + footer)
  // ---------------------------------------------------------------------
  readonly isSavingSettings = signal(false);
  readonly logoUrl = signal('');
  readonly faviconUrl = signal('');
  readonly ownerPhotoUrl = signal('');
  readonly isUploadingLogo = signal(false);
  readonly isUploadingFavicon = signal(false);
  readonly isUploadingOwnerPhoto = signal(false);

  readonly settingsForm = this.fb.nonNullable.group({
    siteName: ['', [Validators.required]],
    ownerName: ['', [Validators.required]],
    ownerTitle: ['', [Validators.required]],
    bio: [''],
    homeHeroEyebrow: [''],
    homeHeroTitle: [''],
    homeHeroSubtitle: [''],
    projectsCompleted: [0, [Validators.required, Validators.min(0)]],
    clientSatisfactionPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    yearsExperience: [0, [Validators.required, Validators.min(0)]],
    citiesServed: [0, [Validators.required, Validators.min(0)]],
    phone: ['', [Validators.required]],
    whatsapp: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    footerTagline: [''],
    socialInstagram: [''],
    socialFacebook: [''],
    socialLinkedin: [''],
    socialYoutube: [''],
  });

  // ---------------------------------------------------------------------
  // HERO BANNER (media only)
  // ---------------------------------------------------------------------
  readonly heroVideoUrl = signal('');
  readonly heroImageUrl = signal('');
  readonly isUploadingHeroVideo = signal(false);
  readonly isUploadingHeroImage = signal(false);
  readonly isSavingHero = signal(false);

  ngOnInit(): void {
    this.loadProjects();
    this.loadTestimonials();
    this.loadServices();
    this.loadGallery();
    this.loadSettings();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  // ---------------------------------------------------------------------
  // PROJECTS: load / form / upload / save / delete
  // ---------------------------------------------------------------------
  private loadProjects(): void {
    this.isLoadingProjects.set(true);
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoadingProjects.set(false);
      },
      error: (error) => {
        console.error('[AdminComponent] Failed to load projects', error);
        this.isLoadingProjects.set(false);
        this.toastService.error('Could not load projects.');
      },
    });
  }

  openNewProjectForm(): void {
    this.editingProjectId.set(null);
    this.projectForm.reset({
      title: '',
      description: '',
      fullDescription: '',
      location: '',
      completedDate: '',
      projectType: 'Independent House',
      areaSqft: 0,
      featured: false,
    });
    this.coverImageUrl.set('');
    this.galleryUrls.set([]);
    this.videoUrls.set([]);
    this.showProjectForm.set(true);
  }

  openEditProjectForm(project: ProjectModel): void {
    this.editingProjectId.set(project.id ?? null);
    this.projectForm.reset({
      title: project.title,
      description: project.description,
      fullDescription: project.fullDescription ?? '',
      location: project.location,
      completedDate: project.completedDate,
      projectType: project.projectType ?? 'Independent House',
      areaSqft: project.areaSqft ?? 0,
      featured: project.featured,
    });
    this.coverImageUrl.set(project.coverImage ?? '');
    this.galleryUrls.set(project.gallery ?? []);
    this.videoUrls.set(project.videos ?? []);
    this.showProjectForm.set(true);
  }

  cancelProjectForm(): void {
    this.showProjectForm.set(false);
    this.editingProjectId.set(null);
  }

  onCoverFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingCover.set(true);
    const path = `projects/covers/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.coverImageUrl.set(downloadUrl);
          this.isUploadingCover.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Cover upload failed', error);
        this.isUploadingCover.set(false);
        this.toastService.error('Cover image upload failed.');
      },
    });
  }

  onGalleryFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || !files.length) return;

    this.isUploadingGallery.set(true);
    let remaining = files.length;

    Array.from(files).forEach((file) => {
      const path = `projects/gallery/${Date.now()}_${file.name}`;
      this.firebaseService.uploadFile(path, file).subscribe({
        next: ({ downloadUrl }) => {
          if (downloadUrl) {
            this.galleryUrls.update((list) => [...list, downloadUrl]);
            remaining -= 1;
            if (remaining <= 0) this.isUploadingGallery.set(false);
          }
        },
        error: (error) => {
          console.error('[AdminComponent] Gallery upload failed', error);
          remaining -= 1;
          if (remaining <= 0) this.isUploadingGallery.set(false);
          this.toastService.error('One or more gallery images failed to upload.');
        },
      });
    });
  }

  onVideoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingVideo.set(true);
    const path = `projects/videos/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.videoUrls.update((list) => [...list, downloadUrl]);
          this.isUploadingVideo.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Project video upload failed', error);
        this.isUploadingVideo.set(false);
        this.toastService.error('Video upload failed.');
      },
    });
  }

  removeGalleryImage(url: string): void {
    this.galleryUrls.update((list) => list.filter((u) => u !== url));
  }

  removeVideo(url: string): void {
    this.videoUrls.update((list) => list.filter((u) => u !== url));
  }

  saveProject(): void {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      this.toastService.error('Please fill in all required project fields.');
      return;
    }
    if (!this.coverImageUrl()) {
      this.toastService.error('Please upload a cover image for the project.');
      return;
    }

    const formValue = this.projectForm.getRawValue();
    const payload: Partial<ProjectModel> = {
      ...formValue,
      coverImage: this.coverImageUrl(),
      gallery: this.galleryUrls(),
      videos: this.videoUrls(),
    };

    this.isSavingProject.set(true);
    const id = this.editingProjectId();

    if (id) {
      this.projectService.updateProject(id, payload).subscribe({
        next: () => this.onProjectSaved('Project updated successfully.'),
        error: () => this.onProjectSaveError(),
      });
    } else {
      const newProject: Partial<ProjectModel> = { ...payload, createdDate: new Date().toISOString() };
      this.projectService.saveProject(newProject).subscribe({
        next: () => this.onProjectSaved('Project added successfully.'),
        error: () => this.onProjectSaveError(),
      });
    }
  }

  private onProjectSaved(message: string): void {
    this.isSavingProject.set(false);
    this.showProjectForm.set(false);
    this.toastService.success(message);
    this.loadProjects();
  }

  private onProjectSaveError(): void {
    this.isSavingProject.set(false);
    this.toastService.error('Could not save the project. Please try again.');
  }

  deleteProject(project: ProjectModel): void {
    if (!project.id) return;
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;

    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.toastService.success('Project deleted.');
        this.loadProjects();
      },
      error: () => this.toastService.error('Could not delete the project.'),
    });
  }

  // ---------------------------------------------------------------------
  // TESTIMONIALS: load / form / upload / save / delete
  // ---------------------------------------------------------------------
  private loadTestimonials(): void {
    this.isLoadingTestimonials.set(true);
    this.testimonialService.getAllTestimonials().subscribe({
      next: (list) => {
        this.testimonials.set(list);
        this.isLoadingTestimonials.set(false);
      },
      error: (error) => {
        console.error('[AdminComponent] Failed to load testimonials', error);
        this.isLoadingTestimonials.set(false);
        this.toastService.error('Could not load testimonials.');
      },
    });
  }

  openNewTestimonialForm(): void {
    this.editingTestimonialId.set(null);
    this.testimonialForm.reset({ customerName: '', location: '', rating: 5, feedback: '' });
    this.testimonialPhotoUrl.set('');
    this.showTestimonialForm.set(true);
  }

  openEditTestimonialForm(t: TestimonialModel): void {
    this.editingTestimonialId.set(t.id ?? null);
    this.testimonialForm.reset({
      customerName: t.customerName,
      location: t.location ?? '',
      rating: t.rating,
      feedback: t.feedback,
    });
    this.testimonialPhotoUrl.set(t.photoUrl ?? '');
    this.showTestimonialForm.set(true);
  }

  cancelTestimonialForm(): void {
    this.showTestimonialForm.set(false);
    this.editingTestimonialId.set(null);
  }

  onTestimonialPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingTestimonialPhoto.set(true);
    const path = `testimonials/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.testimonialPhotoUrl.set(downloadUrl);
          this.isUploadingTestimonialPhoto.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Testimonial photo upload failed', error);
        this.isUploadingTestimonialPhoto.set(false);
        this.toastService.error('Photo upload failed.');
      },
    });
  }

  saveTestimonial(): void {
    if (this.testimonialForm.invalid) {
      this.testimonialForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const payload: Partial<TestimonialModel> = {
      ...this.testimonialForm.getRawValue(),
      photoUrl: this.testimonialPhotoUrl(),
    };

    this.isSavingTestimonial.set(true);
    const id = this.editingTestimonialId();

    if (id) {
      this.testimonialService.updateTestimonial(id, payload).subscribe({
        next: () => this.onTestimonialSaved('Testimonial updated.'),
        error: () => this.onTestimonialSaveError(),
      });
    } else {
      this.testimonialService
        .saveTestimonial({ ...payload, createdDate: new Date().toISOString() })
        .subscribe({
          next: () => this.onTestimonialSaved('Testimonial added.'),
          error: () => this.onTestimonialSaveError(),
        });
    }
  }

  private onTestimonialSaved(message: string): void {
    this.isSavingTestimonial.set(false);
    this.showTestimonialForm.set(false);
    this.toastService.success(message);
    this.loadTestimonials();
  }

  private onTestimonialSaveError(): void {
    this.isSavingTestimonial.set(false);
    this.toastService.error('Could not save the testimonial. Please try again.');
  }

  deleteTestimonial(t: TestimonialModel): void {
    if (!t.id) return;
    if (!confirm(`Delete the testimonial from "${t.customerName}"? This cannot be undone.`)) return;

    this.testimonialService.deleteTestimonial(t.id).subscribe({
      next: () => {
        this.toastService.success('Testimonial deleted.');
        this.loadTestimonials();
      },
      error: () => this.toastService.error('Could not delete the testimonial.'),
    });
  }

  // ---------------------------------------------------------------------
  // SERVICES: load / form / save / delete
  // ---------------------------------------------------------------------
  private loadServices(): void {
    this.isLoadingServices.set(true);
    this.serviceOfferingService.getAllServices().subscribe({
      next: (list) => {
        this.services.set(list);
        this.isLoadingServices.set(false);
      },
      error: (error) => {
        console.error('[AdminComponent] Failed to load services', error);
        this.isLoadingServices.set(false);
        this.toastService.error('Could not load services.');
      },
    });
  }

  openNewServiceForm(): void {
    this.editingServiceId.set(null);
    this.serviceForm.reset({ title: '', description: '', icon: 'fa-solid fa-drafting-compass', order: this.services().length });
    this.showServiceForm.set(true);
  }

  openEditServiceForm(s: ServiceModel): void {
    this.editingServiceId.set(s.id ?? null);
    this.serviceForm.reset({ title: s.title, description: s.description, icon: s.icon, order: s.order ?? 0 });
    this.showServiceForm.set(true);
  }

  cancelServiceForm(): void {
    this.showServiceForm.set(false);
    this.editingServiceId.set(null);
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    this.isSavingService.set(true);
    const payload = this.serviceForm.getRawValue();
    const id = this.editingServiceId();

    if (id) {
      this.serviceOfferingService.updateService(id, payload).subscribe({
        next: () => this.onServiceSaved('Service updated.'),
        error: () => this.onServiceSaveError(),
      });
    } else {
      this.serviceOfferingService.saveService(payload).subscribe({
        next: () => this.onServiceSaved('Service added.'),
        error: () => this.onServiceSaveError(),
      });
    }
  }

  private onServiceSaved(message: string): void {
    this.isSavingService.set(false);
    this.showServiceForm.set(false);
    this.toastService.success(message);
    this.loadServices();
  }

  private onServiceSaveError(): void {
    this.isSavingService.set(false);
    this.toastService.error('Could not save the service. Please try again.');
  }

  deleteService(s: ServiceModel): void {
    if (!s.id) return;
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;

    this.serviceOfferingService.deleteService(s.id).subscribe({
      next: () => {
        this.toastService.success('Service deleted.');
        this.loadServices();
      },
      error: () => this.toastService.error('Could not delete the service.'),
    });
  }

  // ---------------------------------------------------------------------
  // GALLERY: load / upload+add / delete
  // ---------------------------------------------------------------------
  private loadGallery(): void {
    this.isLoadingGallery.set(true);
    this.galleryService.getAllItems().subscribe({
      next: (items) => {
        this.galleryItems.set(items);
        this.isLoadingGallery.set(false);
      },
      error: (error) => {
        console.error('[AdminComponent] Failed to load gallery items', error);
        this.isLoadingGallery.set(false);
        this.toastService.error('Could not load the gallery.');
      },
    });
  }

  openNewGalleryForm(): void {
    this.galleryForm.reset({ type: 'image', caption: '' });
    this.galleryUploadUrl.set('');
    this.showGalleryForm.set(true);
  }

  cancelGalleryForm(): void {
    this.showGalleryForm.set(false);
  }

  onGalleryUploadFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingGalleryFile.set(true);
    const path = `gallery/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.galleryUploadUrl.set(downloadUrl);
          this.isUploadingGalleryFile.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Gallery file upload failed', error);
        this.isUploadingGalleryFile.set(false);
        this.toastService.error('File upload failed.');
      },
    });
  }

  saveGalleryItem(): void {
    if (!this.galleryUploadUrl()) {
      this.toastService.error('Please upload a photo or video first.');
      return;
    }

    this.isSavingGalleryItem.set(true);
    const formValue = this.galleryForm.getRawValue();
    const payload: Partial<GalleryItemModel> = {
      type: formValue.type,
      caption: formValue.caption,
      url: this.galleryUploadUrl(),
      createdDate: new Date().toISOString(),
    };

    this.galleryService.saveItem(payload).subscribe({
      next: () => {
        this.isSavingGalleryItem.set(false);
        this.showGalleryForm.set(false);
        this.toastService.success('Gallery item added.');
        this.loadGallery();
      },
      error: () => {
        this.isSavingGalleryItem.set(false);
        this.toastService.error('Could not add the gallery item.');
      },
    });
  }

  deleteGalleryItem(item: GalleryItemModel): void {
    if (!item.id) return;
    if (!confirm('Delete this gallery item? This cannot be undone.')) return;

    this.galleryService.deleteItem(item.id).subscribe({
      next: () => {
        this.toastService.success('Gallery item deleted.');
        this.loadGallery();
      },
      error: () => this.toastService.error('Could not delete the gallery item.'),
    });
  }

  // ---------------------------------------------------------------------
  // SITE INFO
  // ---------------------------------------------------------------------
  private loadSettings(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => {
        this.settingsForm.patchValue(settings);
        this.logoUrl.set(settings.logoUrl ?? '');
        this.faviconUrl.set(settings.faviconUrl ?? '');
        this.ownerPhotoUrl.set(settings.ownerPhoto ?? '');
        this.heroVideoUrl.set(settings.heroVideoUrl ?? '');
        this.heroImageUrl.set(settings.heroImageUrl ?? '');
      },
      error: () => {
        // No settings doc yet - form keeps its defaults, that's fine.
        console.log('[AdminComponent] No existing site settings found, starting fresh');
      },
    });
  }

  onLogoFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingLogo.set(true);
    const path = `branding/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.logoUrl.set(downloadUrl);
          this.isUploadingLogo.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Logo upload failed', error);
        this.isUploadingLogo.set(false);
        this.toastService.error('Logo upload failed.');
      },
    });
  }

  onFaviconFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingFavicon.set(true);
    const path = `branding/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.faviconUrl.set(downloadUrl);
          this.isUploadingFavicon.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Favicon upload failed', error);
        this.isUploadingFavicon.set(false);
        this.toastService.error('Favicon upload failed.');
      },
    });
  }

  onOwnerPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingOwnerPhoto.set(true);
    const path = `branding/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.ownerPhotoUrl.set(downloadUrl);
          this.isUploadingOwnerPhoto.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Owner photo upload failed', error);
        this.isUploadingOwnerPhoto.set(false);
        this.toastService.error('Photo upload failed.');
      },
    });
  }

  removeLogo(): void {
    this.logoUrl.set('');
  }

  removeFavicon(): void {
    this.faviconUrl.set('');
  }

  removeOwnerPhoto(): void {
    this.ownerPhotoUrl.set('');
  }

  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    this.isSavingSettings.set(true);
    const payload = {
      ...this.settingsForm.getRawValue(),
      logoUrl: this.logoUrl(),
      faviconUrl: this.faviconUrl(),
      ownerPhoto: this.ownerPhotoUrl(),
    };
    this.settingsService.updateSiteSettings(payload).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.toastService.success('Site info updated.');
      },
      error: () => {
        this.isSavingSettings.set(false);
        this.toastService.error('Could not save site info.');
      },
    });
  }

  // ---------------------------------------------------------------------
  // HERO BANNER (media only)
  // ---------------------------------------------------------------------
  onHeroVideoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingHeroVideo.set(true);
    const path = `hero/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.heroVideoUrl.set(downloadUrl);
          this.isUploadingHeroVideo.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Hero video upload failed', error);
        this.isUploadingHeroVideo.set(false);
        this.toastService.error('Hero video upload failed.');
      },
    });
  }

  onHeroImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploadingHeroImage.set(true);
    const path = `hero/${Date.now()}_${file.name}`;
    this.firebaseService.uploadFile(path, file).subscribe({
      next: ({ downloadUrl }) => {
        if (downloadUrl) {
          this.heroImageUrl.set(downloadUrl);
          this.isUploadingHeroImage.set(false);
        }
      },
      error: (error) => {
        console.error('[AdminComponent] Hero image upload failed', error);
        this.isUploadingHeroImage.set(false);
        this.toastService.error('Hero image upload failed.');
      },
    });
  }

  removeHeroVideo(): void {
    this.heroVideoUrl.set('');
  }

  removeHeroImage(): void {
    this.heroImageUrl.set('');
  }

  saveHeroMedia(): void {
    this.isSavingHero.set(true);
    this.settingsService
      .updateSiteSettings({ heroVideoUrl: this.heroVideoUrl(), heroImageUrl: this.heroImageUrl() })
      .subscribe({
        next: () => {
          this.isSavingHero.set(false);
          this.toastService.success('Hero banner updated.');
        },
        error: () => {
          this.isSavingHero.set(false);
          this.toastService.error('Could not save hero banner.');
        },
      });
  }

  // ---------------------------------------------------------------------
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigateByUrl('/admin/login');
    });
  }
}
