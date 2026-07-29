import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { VideoModalComponent } from '../../shared/components/video-modal/video-modal.component';

import { ProjectService } from '../../core/services/project.service';
import { ProjectModel } from '../../core/models/project.model';

/** Deep-dive page for a single project: full gallery, stages, materials, videos. */
@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, ImageModalComponent, VideoModalComponent],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  readonly project = signal<ProjectModel | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly activeVideoUrl = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      console.error('[ProjectDetailsComponent] No project id in route');
      this.loadError.set(true);
      this.isLoading.set(false);
      return;
    }

    console.log(`[ProjectDetailsComponent] Loading project "${id}"`);
    this.projectService.getProjectById(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(`[ProjectDetailsComponent] Failed to load project "${id}"`, error);
        this.loadError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  openLightbox(index: number): void {
    this.lightboxIndex.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  openVideo(url: string): void {
    this.activeVideoUrl.set(url);
  }

  closeVideo(): void {
    this.activeVideoUrl.set(null);
  }

  get fullGallery(): string[] {
    const project = this.project();
    if (!project) return [];
    return [project.coverImage, ...(project.gallery ?? [])];
  }
}
