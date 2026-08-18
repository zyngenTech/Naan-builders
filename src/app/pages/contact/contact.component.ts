import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HeroComponent } from '../../shared/components/hero/hero.component';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';

import { InquiryService } from '../../core/services/inquiry.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsService } from '../../core/services/settings.service';
import { InquiryModel } from '../../core/models/inquiry.model';
import { SiteSettingsModel } from '../../core/models/settings.model';
import { environment } from '../../../environments/environment';
import { toWhatsAppDigits } from '../../shared/utils/phone.util';
import { logger } from '../../core/logger';

/**
 * ContactComponent
 * Public inquiry form. Fully reactive-form driven with validation,
 * a loading spinner during submit, and success/error toasts.
 * No authentication - anyone can submit; data lands directly in Firestore.
 * The displayed phone/email/address are admin-editable (settings/site),
 * falling back to the environment defaults.
 *
 * Submission flow (in this exact order, and never any other):
 *   1. Validate the form.
 *   2. Save the inquiry to Firestore FIRST.
 *   3. Only if that save succeeds: show a success toast, then open
 *      WhatsApp with a pre-filled message to the admin.
 *   4. If the save fails: WhatsApp is never opened, an error toast is
 *      shown, and the error is logged.
 * This order matters - the inquiry must always exist in Firestore even
 * if the customer closes WhatsApp or decides not to send that message,
 * so the business never loses a lead just because WhatsApp didn't open.
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeroComponent, SectionTitleComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inquiryService = inject(InquiryService);
  private toastService = inject(ToastService);
  private settingsService = inject(SettingsService);

  private settings = signal<SiteSettingsModel | null>(null);
  readonly contact = computed(() => {
    const s = this.settings();
    return {
      phone: s?.phone || environment.contact.phone,
      whatsapp: s?.whatsapp || environment.contact.whatsapp,
      email: s?.email || environment.contact.email,
      address: s?.address || environment.contact.address,
    };
  });
  readonly heroImage = computed(() => this.settings()?.heroImageContact);

  ngOnInit(): void {
    this.settingsService.getSiteSettings().subscribe({
      next: (settings) => this.settings.set(settings),
      error: (error) => logger.error('[ContactComponent] Failed to load contact settings', error),
    });
  }

  readonly isSubmitting = signal(false);

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
    // Step 1: validate.
    if (this.inquiryForm.invalid) {
      logger.log('[ContactComponent] Form invalid, marking all fields as touched');
      this.inquiryForm.markAllAsTouched();
      this.toastService.error('Please fix the highlighted fields before submitting.');
      return;
    }

    const formValue = this.inquiryForm.getRawValue();
    const payload: Omit<InquiryModel, 'id'> = {
      ...formValue,
      status: 'new',
      createdDate: new Date().toISOString(),
    };

    logger.log('[ContactComponent] Submitting inquiry', payload);
    this.isSubmitting.set(true);

    // Step 2: save to Firestore first - nothing WhatsApp-related happens
    // until this call actually succeeds.
    this.inquiryService.sendInquiry(payload).subscribe({
      next: () => {
        // Step 3: Firestore save succeeded.
        logger.log('[ContactComponent] Inquiry saved to Firestore successfully');
        this.toastService.success('Thank you! Your inquiry has been received - opening WhatsApp to confirm with us directly.');
        this.isSubmitting.set(false);
        this.openWhatsAppWithInquiry(formValue);
        this.inquiryForm.reset();
      },
      error: (error) => {
        // Step 4: Firestore save failed - WhatsApp must NOT open.
        logger.error('[ContactComponent] Failed to save inquiry to Firestore - WhatsApp will not open', error);
        this.toastService.error('Something went wrong while sending your inquiry. Please try again or call us directly.');
        this.isSubmitting.set(false);
      },
    });
  }

  /** Opens WhatsApp (new tab) with a pre-filled message to the admin, summarizing the inquiry just saved. */
  private openWhatsAppWithInquiry(formValue: Omit<InquiryModel, 'id' | 'status' | 'createdDate'>): void {
    const adminNumber = toWhatsAppDigits(this.contact().whatsapp);
    const message =
      `New inquiry from ${formValue.name}\n` +
      `Phone: ${formValue.phone}\n` +
      `Location: ${formValue.location}\n` +
      `Project type: ${formValue.projectType}\n` +
      `Budget: ${formValue.budget}\n` +
      `Message: ${formValue.message}`;

    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    logger.log('[ContactComponent] Opening WhatsApp with pre-filled inquiry message');
    window.open(whatsappUrl, '_blank', 'noopener');
  }
}
