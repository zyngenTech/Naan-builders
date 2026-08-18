import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

import { ProjectService } from '../../core/services/project.service';
import { SettingsService } from '../../core/services/settings.service';
import { ProjectModel } from '../../core/models/project.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { logger } from '../../core/logger';

/** Grid of all completed projects, filterable by project type. */
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, HeroComponent, ProjectCardComponent, LoaderComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private settingsService = inject(SettingsService);

  readonly allProjects = signal<ProjectModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeFilter = signal<string>('All');
  readonly settings = signal<SiteSettingsModel | null>(null);

  readonly filterOptions = computed(() => {
    const types = new Set(this.allProjects().map((p) => p.projectType).filter(Boolean) as string[]);
    return ['All', ...Array.from(types)];
  });

  readonly filteredProjects = computed(() => {
    const filter = this.activeFilter();
    const projects = this.allProjects();
    return filter === 'All' ? projects : projects.filter((p) => p.projectType === filter);
  });

  // Computed here (not inline in the template) to keep the binding a
  // simple, type-safe expression and avoid a hardcoded project count.
  readonly heroTitle = computed(() => {
    const count = this.settings()?.projectsCompleted;
    return count ? `${count}+ Homes, Each With Its Own Story` : 'Homes, Each With Its Own Story';
  });

  ngOnInit(): void {
    logger.log('[ProjectsComponent] Loading all projects');
    this.projectService.getAllProjects().subscribe({
      next: (projects) => {
        this.allProjects.set(projects);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[ProjectsComponent] Failed to load projects', error);
        this.isLoading.set(false);
      },
    });

    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings ?? null),
      error: (error) => logger.error('[ProjectsComponent] Failed to load site settings', error),
    });
  }

  setFilter(type: string): void {
    logger.log('[ProjectsComponent] Filter changed ->', type);
    this.activeFilter.set(type);
  }

  trackByProjectId(_index: number, project: ProjectModel): string {
    return project.id ?? project.title;
  }
}
