import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { FirebaseService, orderBy, where } from './firebase.service';
import { ProjectModel } from '../models/project.model';

const COLLECTION = 'projects';

/**
 * ProjectService
 * Thin, domain-specific wrapper around FirebaseService for the "projects"
 * collection. Pages depend on this rather than FirebaseService directly.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private firebaseService = inject(FirebaseService);

  /** All projects, most recently completed first. */
  getAllProjects(): Observable<ProjectModel[]> {
    console.log('[ProjectService] Loading all projects');
    return this.firebaseService
      .getData<ProjectModel>(COLLECTION, [orderBy('completedDate', 'desc')])
      .pipe(
        tap((projects) => console.log(`[ProjectService] ${projects.length} projects loaded`)),
        catchError((error) => {
          console.error('[ProjectService] Failed to load projects', error);
          throw error;
        })
      );
  }

  /** Only projects flagged `featured: true`, used on the Home page. */
  getFeaturedProjects(): Observable<ProjectModel[]> {
    console.log('[ProjectService] Loading featured projects');
    return this.firebaseService
      .getData<ProjectModel>(COLLECTION, [where('featured', '==', true), orderBy('completedDate', 'desc')])
      .pipe(
        catchError((error) => {
          console.error('[ProjectService] Failed to load featured projects', error);
          throw error;
        })
      );
  }

  /** Single project by id, used on the Project Details page. */
  getProjectById(id: string): Observable<ProjectModel> {
    console.log(`[ProjectService] Loading project "${id}"`);
    return this.firebaseService.getDocById<ProjectModel>(COLLECTION, id).pipe(
      catchError((error) => {
        console.error(`[ProjectService] Failed to load project "${id}"`, error);
        throw error;
      })
    );
  }

  saveProject(project: Partial<ProjectModel>): Observable<string> {
    return this.firebaseService.saveData(COLLECTION, project);
  }

  updateProject(id: string, project: Partial<ProjectModel>): Observable<void> {
    return this.firebaseService.updateData(COLLECTION, id, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.firebaseService.deleteData(COLLECTION, id);
  }
}
