import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectModel } from '../../../core/models/project.model';

/**
 * ProjectCardComponent
 * Reusable card for a single project - used on Home ("Latest Projects")
 * and on the full Projects grid page.
 */
@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  @Input({ required: true }) project!: ProjectModel;

  get completedYear(): string {
    return this.project.completedDate ? new Date(this.project.completedDate).getFullYear().toString() : '';
  }
}
