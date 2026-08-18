import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MilestoneService } from '../../../../core/services/milestone.service';
import { ToastService } from '../../../../core/services/toast.service';
import { MilestoneModel } from '../../../../core/models/milestone.model';
import { logger } from '../../../../core/logger';

/** Full CRUD for the "milestones" collection (About page Journey timeline). */
@Component({
  selector: 'app-admin-milestones-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-milestones-manager.component.html',
  styleUrl: './admin-milestones-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMilestonesManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private milestoneService = inject(MilestoneService);
  private toastService = inject(ToastService);

  readonly milestones = signal<MilestoneModel[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly milestoneForm = this.fb.nonNullable.group({
    year: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', Validators.required],
    order: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    logger.log('[AdminMilestonesManagerComponent] Loading milestones');
    this.loadMilestones();
  }

  private loadMilestones(): void {
    this.isLoading.set(true);
    this.milestoneService.getAllMilestones().subscribe({
      next: (milestones) => {
        this.milestones.set(milestones);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminMilestonesManagerComponent] Failed to load milestones', error);
        this.isLoading.set(false);
      },
    });
  }

  get f() {
    return this.milestoneForm.controls;
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.milestoneForm.reset({ order: this.milestones().length + 1 });
    this.showForm.set(true);
  }

  openEditForm(milestone: MilestoneModel): void {
    this.editingId.set(milestone.id ?? null);
    this.milestoneForm.reset({
      year: milestone.year,
      title: milestone.title,
      description: milestone.description,
      order: milestone.order ?? 1,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  onSubmit(): void {
    if (this.milestoneForm.invalid) {
      this.milestoneForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const payload = this.milestoneForm.getRawValue();
    this.isSaving.set(true);
    const id = this.editingId();

    if (id) {
      logger.log(`[AdminMilestonesManagerComponent] Updating milestone "${id}"`, payload);
      this.milestoneService.updateMilestone(id, payload).subscribe({
        next: () => this.onSaveSuccess('Milestone updated.'),
        error: (error) => this.onSaveError(error),
      });
    } else {
      logger.log('[AdminMilestonesManagerComponent] Creating new milestone', payload);
      this.milestoneService.saveMilestone(payload).subscribe({
        next: () => this.onSaveSuccess('Milestone added.'),
        error: (error) => this.onSaveError(error),
      });
    }
  }

  private onSaveSuccess(message: string): void {
    this.toastService.success(message);
    this.isSaving.set(false);
    this.showForm.set(false);
    this.loadMilestones();
  }

  private onSaveError(error: unknown): void {
    logger.error('[AdminMilestonesManagerComponent] Save failed', error);
    this.toastService.error('Failed to save milestone.');
    this.isSaving.set(false);
  }

  deleteMilestone(milestone: MilestoneModel): void {
    if (!milestone.id) return;
    if (!confirm(`Delete milestone "${milestone.title}"?`)) return;

    logger.log(`[AdminMilestonesManagerComponent] Deleting milestone "${milestone.id}"`);
    this.milestoneService.deleteMilestone(milestone.id).subscribe({
      next: () => {
        this.toastService.success('Milestone deleted.');
        this.loadMilestones();
      },
      error: (error) => {
        logger.error(`[AdminMilestonesManagerComponent] Failed to delete milestone "${milestone.id}"`, error);
        this.toastService.error('Failed to delete milestone.');
      },
    });
  }
}
