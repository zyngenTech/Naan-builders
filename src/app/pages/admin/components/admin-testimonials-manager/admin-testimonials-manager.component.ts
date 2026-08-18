import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminUploadComponent } from '../../../../shared/components/admin-upload/admin-upload.component';
import { ImgFallbackDirective } from '../../../../shared/directives/img-fallback.directive';
import { TestimonialService } from '../../../../core/services/testimonial.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TestimonialModel } from '../../../../core/models/testimonial.model';
import { logger } from '../../../../core/logger';

/** Full CRUD for the "testimonials" collection. */
@Component({
  selector: 'app-admin-testimonials-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AdminUploadComponent, ImgFallbackDirective],
  templateUrl: './admin-testimonials-manager.component.html',
  styleUrl: './admin-testimonials-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTestimonialsManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private testimonialService = inject(TestimonialService);
  private toastService = inject(ToastService);

  readonly testimonials = signal<TestimonialModel[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly photoUrl = signal<string | null>(null);

  readonly ratingOptions = [1, 2, 3, 4, 5];

  readonly testimonialForm = this.fb.nonNullable.group({
    customerName: ['', Validators.required],
    location: [''],
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    feedback: ['', Validators.required],
  });

  ngOnInit(): void {
    logger.log('[AdminTestimonialsManagerComponent] Loading testimonials');
    this.loadTestimonials();
  }

  private loadTestimonials(): void {
    this.isLoading.set(true);
    this.testimonialService.getAllTestimonials().subscribe({
      next: (testimonials) => {
        this.testimonials.set(testimonials);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminTestimonialsManagerComponent] Failed to load testimonials', error);
        this.isLoading.set(false);
      },
    });
  }

  get f() {
    return this.testimonialForm.controls;
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.testimonialForm.reset({ rating: 5 });
    this.photoUrl.set(null);
    this.showForm.set(true);
  }

  openEditForm(testimonial: TestimonialModel): void {
    this.editingId.set(testimonial.id ?? null);
    this.testimonialForm.reset({
      customerName: testimonial.customerName,
      location: testimonial.location ?? '',
      rating: testimonial.rating,
      feedback: testimonial.feedback,
    });
    this.photoUrl.set(testimonial.photoUrl ?? null);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  onPhotoUploaded(url: string): void {
    this.photoUrl.set(url);
  }
  onPhotoRemoved(): void {
    this.photoUrl.set(null);
  }

  onSubmit(): void {
    if (this.testimonialForm.invalid) {
      this.testimonialForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const payload: Partial<TestimonialModel> = {
      ...this.testimonialForm.getRawValue(),
      photoUrl: this.photoUrl() ?? '',
    };

    this.isSaving.set(true);
    const id = this.editingId();

    if (id) {
      logger.log(`[AdminTestimonialsManagerComponent] Updating testimonial "${id}"`, payload);
      this.testimonialService.updateTestimonial(id, payload).subscribe({
        next: () => this.onSaveSuccess('Testimonial updated.'),
        error: (error) => this.onSaveError(error),
      });
    } else {
      const newPayload = { ...payload, createdDate: new Date().toISOString() };
      logger.log('[AdminTestimonialsManagerComponent] Creating new testimonial', newPayload);
      this.testimonialService.saveTestimonial(newPayload).subscribe({
        next: () => this.onSaveSuccess('Testimonial added.'),
        error: (error) => this.onSaveError(error),
      });
    }
  }

  private onSaveSuccess(message: string): void {
    this.toastService.success(message);
    this.isSaving.set(false);
    this.showForm.set(false);
    this.loadTestimonials();
  }

  private onSaveError(error: unknown): void {
    logger.error('[AdminTestimonialsManagerComponent] Save failed', error);
    this.toastService.error('Failed to save testimonial.');
    this.isSaving.set(false);
  }

  deleteTestimonial(testimonial: TestimonialModel): void {
    if (!testimonial.id) return;
    if (!confirm(`Delete testimonial from "${testimonial.customerName}"?`)) return;

    logger.log(`[AdminTestimonialsManagerComponent] Deleting testimonial "${testimonial.id}"`);
    this.testimonialService.deleteTestimonial(testimonial.id).subscribe({
      next: () => {
        this.toastService.success('Testimonial deleted.');
        this.loadTestimonials();
      },
      error: (error) => {
        logger.error(`[AdminTestimonialsManagerComponent] Failed to delete testimonial "${testimonial.id}"`, error);
        this.toastService.error('Failed to delete testimonial.');
      },
    });
  }
}
