import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { FirebaseService, orderBy, where } from './firebase.service';
import { CacheService } from './cache.service';
import { ProjectModel } from '../models/project.model';
import { logger } from '../logger';

const COLLECTION = 'projects';

/**
 * ProjectService
 * Thin, domain-specific wrapper around FirebaseService for the "projects"
 * collection. Pages depend on this rather than FirebaseService directly.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private firebaseService = inject(FirebaseService);
  private cacheService = inject(CacheService);

  /** All projects, most recently completed first. */
  getAllProjects(): Observable<ProjectModel[]> {
    logger.log('[ProjectService] Loading all projects');
    return this.cacheService.get('projects-all', () =>
      this.firebaseService
        .getData<ProjectModel>(COLLECTION, [orderBy('completedDate', 'desc')])
        .pipe(
          tap((projects) => logger.log(`[ProjectService] ${projects.length} projects loaded`)),
          catchError((error) => {
            logger.error('[ProjectService] Failed to load projects', error);
            throw error;
          })
        )
    );
  }

  /**
   * Only projects flagged `featured: true`, used on the Home page.
   * Filters by `featured` only (no orderBy) so this never needs a Firestore
   * composite index - the result is sorted by completedDate client-side
   * instead, since the list is always small.
   */
  getFeaturedProjects(): Observable<ProjectModel[]> {
    logger.log('[ProjectService] Loading featured projects');
    return this.cacheService.get('projects-featured', () =>
      this.firebaseService.getData<ProjectModel>(COLLECTION, [where('featured', '==', true)]).pipe(
        map((projects) =>
          [...projects].sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
        ),
        catchError((error) => {
          logger.error('[ProjectService] Failed to load featured projects', error);
          throw error;
        })
      )
    );
  }

  /** Single project by id, used on the Project Details page. */
  getProjectById(id: string): Observable<ProjectModel> {
    logger.log(`[ProjectService] Loading project "${id}"`);
    return this.cacheService.get(`project-${id}`, () =>
      this.firebaseService.getDocById<ProjectModel>(COLLECTION, id).pipe(
        catchError((error) => {
          logger.error(`[ProjectService] Failed to load project "${id}"`, error);
          throw error;
        })
      )
    );
  }

  saveProject(project: Partial<ProjectModel>): Observable<string> {
    return this.firebaseService.saveData(COLLECTION, project).pipe(
      tap(() => {
        this.cacheService.invalidate('projects-all');
        this.cacheService.invalidate('projects-featured');
      })
    );
  }

  updateProject(id: string, project: Partial<ProjectModel>): Observable<void> {
    return this.firebaseService.updateData(COLLECTION, id, project).pipe(
      tap(() => {
        this.cacheService.invalidate('projects-all');
        this.cacheService.invalidate('projects-featured');
        this.cacheService.invalidate(`project-${id}`);
      })
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.firebaseService.deleteData(COLLECTION, id).pipe(
      tap(() => {
        this.cacheService.invalidate('projects-all');
        this.cacheService.invalidate('projects-featured');
        this.cacheService.invalidate(`project-${id}`);
      })
    );
  }
}
