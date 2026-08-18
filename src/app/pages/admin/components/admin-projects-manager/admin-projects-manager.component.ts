import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminUploadComponent } from '../../../../shared/components/admin-upload/admin-upload.component';
import { AdminMultiUploadComponent } from '../../../../shared/components/admin-multi-upload/admin-multi-upload.component';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';
import { ProjectService } from '../../../../core/services/project.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProjectModel } from '../../../../core/models/project.model';
import { logger } from '../../../../core/logger';

/**
 * AdminProjectsManagerComponent
 * Full CRUD for the "projects" collection - list, create, edit, delete.
 * Cover photo uses AdminUploadComponent (single file); gallery photos and
 * videos each use AdminMultiUploadComponent (any number of files).
 */
@Component({
  selector: 'app-admin-projects-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminUploadComponent, AdminMultiUploadComponent, ImgFallbackDirective],
  templateUrl: './admin-projects-manager.component.html',
  styleUrl: './admin-projects-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProjectsManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);

  readonly projects = signal<ProjectModel[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly coverImageUrl = signal<string | null>(null);
  readonly galleryUrls = signal<string[]>([]);
  readonly videoUrls = signal<string[]>([]);

  readonly projectTypes = ['Independent House', 'Duplex', 'Renovation', 'Villa', 'Apartment'];

  readonly projectForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    fullDescription: [''],
    location: ['', Validators.required],
    completedDate: ['', Validators.required],
    areaSqft: [0, [Validators.min(0)]],
    projectType: ['Independent House', Validators.required],
    featured: [false],
  });

  ngOnInit(): void {
    logger.log('[AdminProjectsManagerComponent] Loading all projects');
    this.loadProjects();
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminProjectsManagerComponent] Failed to load projects', error);
        this.isLoading.set(false);
      },
    });
  }

  get f() {
    return this.projectForm.controls;
  }

  openAddForm(): void {
    logger.log('[AdminProjectsManagerComponent] Opening blank form for new project');
    this.editingId.set(null);
    this.projectForm.reset({ featured: false, projectType: 'Independent House', areaSqft: 0 });
    this.coverImageUrl.set(null);
    this.galleryUrls.set([]);
    this.videoUrls.set([]);
    this.showForm.set(true);
  }

  openEditForm(project: ProjectModel): void {
    logger.log(`[AdminProjectsManagerComponent] Opening edit form for "${project.id}"`);
    this.editingId.set(project.id ?? null);
    this.projectForm.reset({
      title: project.title,
      description: project.description,
      fullDescription: project.fullDescription ?? '',
      location: project.location,
      completedDate: project.completedDate?.slice(0, 10) ?? '',
      areaSqft: project.areaSqft ?? 0,
      projectType: project.projectType ?? 'Independent House',
      featured: project.featured,
    });
    this.coverImageUrl.set(project.coverImage ?? null);
    this.galleryUrls.set(project.gallery ?? []);
    this.videoUrls.set(project.videos ?? []);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  onCoverUploaded(url: string): void {
    this.coverImageUrl.set(url);
  }
  onCoverRemoved(): void {
    this.coverImageUrl.set(null);
  }
  onGalleryChange(urls: string[]): void {
    this.galleryUrls.set(urls);
  }
  onVideosChange(urls: string[]): void {
    this.videoUrls.set(urls);
  }

  onSubmit(): void {
    if (this.projectForm.invalid) {
      logger.log('[AdminProjectsManagerComponent] Form invalid');
      this.projectForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }
    if (!this.coverImageUrl()) {
      this.toastService.error('Please upload a cover photo for this project.');
      return;
    }

    const formValue = this.projectForm.getRawValue();
    const payload: Partial<ProjectModel> = {
      ...formValue,
      completedDate: new Date(formValue.completedDate).toISOString(),
      coverImage: this.coverImageUrl()!,
      gallery: this.galleryUrls(),
      videos: this.videoUrls(),
    };

    this.isSaving.set(true);
    const id = this.editingId();

    if (id) {
      logger.log(`[AdminProjectsManagerComponent] Updating project "${id}"`, payload);
      this.projectService.updateProject(id, payload).subscribe({
        next: () => this.onSaveSuccess('Project updated successfully.'),
        error: (error) => this.onSaveError(error),
      });
    } else {
      const newPayload = { ...payload, createdDate: new Date().toISOString() };
      logger.log('[AdminProjectsManagerComponent] Creating new project', newPayload);
      this.projectService.saveProject(newPayload).subscribe({
        next: () => this.onSaveSuccess('Project added successfully.'),
        error: (error) => this.onSaveError(error),
      });
    }
  }

  private onSaveSuccess(message: string): void {
    this.toastService.success(message);
    this.isSaving.set(false);
    this.showForm.set(false);
    this.loadProjects();
  }

  private onSaveError(error: unknown): void {
    logger.error('[AdminProjectsManagerComponent] Save failed', error);
    this.toastService.error('Failed to save project. Please try again.');
    this.isSaving.set(false);
  }

  deleteProject(project: ProjectModel): void {
    if (!project.id) return;
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;

    logger.log(`[AdminProjectsManagerComponent] Deleting project "${project.id}"`);
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.toastService.success('Project deleted.');
        this.loadProjects();
      },
      error: (error) => {
        logger.error(`[AdminProjectsManagerComponent] Failed to delete project "${project.id}"`, error);
        this.toastService.error('Failed to delete project.');
      },
    });
  }
}
