import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

import { InquiryService } from '../../core/services/inquiry.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';
import { InquiryModel } from '../../core/models/inquiry.model';

/**
 * ContactComponent
 * Public inquiry form. Fully reactive-form driven with validation,
 * a loading spinner during submit, and success/error toasts.
 * No authentication - anyone can submit; data lands directly in Firestore.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroComponent, SectionTitleComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private inquiryService = inject(InquiryService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);

  readonly isSubmitting = signal(false);
  /** Admin-editable contact details, live-updated via the shared settings signal. */
  readonly contact = this.settingsService.settings;

  constructor() {
    this.settingsService.ensureLoaded();
  }

  readonly projectTypes = ['New Construction', 'Renovation', 'Interior Coordination', 'Structural Design Only', 'Other'];
  readonly budgetRanges = ['Under 15 Lakhs', '15-30 Lakhs', '30-50 Lakhs', '50 Lakhs - 1 Crore', 'Above 1 Crore'];

  readonly inquiryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{10,15}$/)]],
    email: ['', [Validators.required, Validators.email]],
    location: ['', [Validators.required, Validators.maxLength(100)]],
    projectType: ['', [Validators.required]],
    budget: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(600)]],
  });

  // Convenience getter so the template can read validation state tersely.
  get f() {
    return this.inquiryForm.controls;
  }

  onSubmit(): void {
    if (this.inquiryForm.invalid) {
      console.log('[ContactComponent] Form invalid, marking all fields as touched');
      this.inquiryForm.markAllAsTouched();
      this.toastService.error('Please fix the highlighted fields before submitting.');
      return;
    }

    const payload: Omit<InquiryModel, 'id'> = {
      ...this.inquiryForm.getRawValue(),
      status: 'new',
      createdDate: new Date().toISOString(),
    };

    console.log('[ContactComponent] Submitting inquiry', payload);
    this.isSubmitting.set(true);

    this.inquiryService.sendInquiry(payload).subscribe({
      next: () => {
        console.log('[ContactComponent] Inquiry submitted successfully');
        this.toastService.success('Thank you! Your inquiry has been received - we will contact you within 24 hours.');
        this.inquiryForm.reset();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('[ContactComponent] Failed to submit inquiry', error);
        this.toastService.error('Something went wrong while sending your inquiry. Please try again or call us directly.');
        this.isSubmitting.set(false);
      },
    });
  }
}
