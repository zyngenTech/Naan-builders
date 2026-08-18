import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ImageModalComponent } from '../../shared/components/image-modal/image-modal.component';
import { VideoModalComponent } from '../../shared/components/video-modal/video-modal.component';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { CloudinaryOptimizePipe } from '../../shared/pipes/cloudinary-optimize.pipe';

import { ProjectService } from '../../core/services/project.service';
import { ProjectModel } from '../../core/models/project.model';
import { SeoService } from '../../core/services/seo.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { logger } from '../../core/logger';

/** Deep-dive page for a single project: full gallery, stages, materials, videos. */
@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent, ImageModalComponent, VideoModalComponent, ImgFallbackDirective, CloudinaryOptimizePipe],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);
  private seo = inject(SeoService);
  private cloudinary = inject(CloudinaryService);

  readonly project = signal<ProjectModel | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal(false);

  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly activeVideoUrl = signal<string | null>(null);

  /**
   * Subscribes to paramMap rather than reading route.snapshot once.
   * Angular reuses this component instance when navigating between two
   * project detail URLs (/projects/a -> /projects/b), and ngOnInit does
   * not run again - a snapshot read would leave the previous project on
   * screen. The subscription is torn down with the component.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');

      // Reset per-project view state so a failed or in-flight load never
      // shows the previously viewed project's content.
      this.isLoading.set(true);
      this.loadError.set(false);
      this.project.set(null);
      this.closeLightbox();
      this.closeVideo();

      if (!id) {
        logger.error('[ProjectDetailsComponent] No project id in route');
        this.loadError.set(true);
        this.isLoading.set(false);
        return;
      }

      logger.log(`[ProjectDetailsComponent] Loading project "${id}"`);
      this.projectService
        .getProjectById(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (project) => {
            this.project.set(project);
            this.isLoading.set(false);
            this.applyProjectSeo(project, id);
          },
          error: (error) => {
            logger.error(`[ProjectDetailsComponent] Failed to load project "${id}"`, error);
            this.loadError.set(true);
            this.isLoading.set(false);
          },
        });
    });
  }

  /**
   * Replaces the route's generic description with this project's own, so
   * each project page is a distinct result in search rather than ten
   * near-duplicates. Uses the project cover as the social card image.
   */
  private applyProjectSeo(project: ProjectModel | null, id: string): void {
    if (!project) {
      return;
    }
    const summary = (project.description || project.fullDescription || '').trim();
    const description = summary
      ? summary.slice(0, 160)
      : `${project.title} - a completed residential construction project by NaanBuilders in ${project.location}.`;

    this.seo.update({
      description,
      path: `/projects/${id}`,
      image: project.coverImage ? this.cloudinary.getThumbnail(project.coverImage) : undefined,
      type: 'article',
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
