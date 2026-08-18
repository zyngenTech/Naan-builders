import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InquiryService } from '../../../../core/services/inquiry.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InquiryModel, InquiryStatus } from '../../../../core/models/inquiry.model';
import { toWhatsAppDigits } from '../../../../shared/utils/phone.util';
import { logger } from '../../../../core/logger';

type StatusFilter = 'all' | InquiryStatus;

/**
 * AdminInquiriesManagerComponent
 * Shows every inquiry submitted through the public Contact form, with
 * full customer details (name, phone, email, location, project type,
 * budget, message, submitted date). Admin can mark an inquiry's status
 * (new / contacted / closed), reply directly on WhatsApp with one tap,
 * or delete it. Read/update/delete all require the signed-in admin
 * account (see firestore.rules) - visitors can only ever create one.
 */
@Component({
  selector: 'app-admin-inquiries-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-inquiries-manager.component.html',
  styleUrl: './admin-inquiries-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminInquiriesManagerComponent implements OnInit {
  private inquiryService = inject(InquiryService);
  private toastService = inject(ToastService);

  readonly inquiries = signal<InquiryModel[]>([]);
  readonly isLoading = signal(true);
  readonly activeFilter = signal<StatusFilter>('all');
  readonly expandedId = signal<string | null>(null);

  readonly statusOptions: StatusFilter[] = ['all', 'new', 'contacted', 'closed'];

  readonly filteredInquiries = computed(() => {
    const filter = this.activeFilter();
    const list = this.inquiries();
    return filter === 'all' ? list : list.filter((i) => i.status === filter);
  });

  readonly newCount = computed(() => this.inquiries().filter((i) => i.status === 'new').length);

  ngOnInit(): void {
    logger.log('[AdminInquiriesManagerComponent] Loading inquiries');
    this.loadInquiries();
  }

  private loadInquiries(): void {
    this.isLoading.set(true);
    this.inquiryService.getAllInquiries().subscribe({
      next: (inquiries) => {
        this.inquiries.set(inquiries);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminInquiriesManagerComponent] Failed to load inquiries', error);
        this.toastService.error('Failed to load inquiries.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: StatusFilter): void {
    this.activeFilter.set(filter);
  }

  toggleExpanded(id: string | undefined): void {
    if (!id) return;
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  setStatus(inquiry: InquiryModel, status: InquiryStatus, event: Event): void {
    event.stopPropagation();
    if (!inquiry.id || inquiry.status === status) return;

    logger.log(`[AdminInquiriesManagerComponent] Marking inquiry "${inquiry.id}" as "${status}"`);
    this.inquiryService.updateInquiryStatus(inquiry.id, status).subscribe({
      next: () => {
        this.inquiries.update((list) =>
          list.map((i) => (i.id === inquiry.id ? { ...i, status } : i))
        );
        this.toastService.success(`Marked as ${status}.`);
      },
      error: (error) => {
        logger.error(`[AdminInquiriesManagerComponent] Failed to update status for "${inquiry.id}"`, error);
        this.toastService.error('Failed to update status.');
      },
    });
  }

  whatsappReplyUrl(inquiry: InquiryModel): string {
    const digits = toWhatsAppDigits(inquiry.phone);
    const message = `Hi ${inquiry.name}, thank you for your inquiry with us about your ${inquiry.projectType} project. `;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  deleteInquiry(inquiry: InquiryModel, event: Event): void {
    event.stopPropagation();
    if (!inquiry.id) return;
    if (!confirm(`Delete the inquiry from "${inquiry.name}"? This cannot be undone.`)) return;

    logger.log(`[AdminInquiriesManagerComponent] Deleting inquiry "${inquiry.id}"`);
    this.inquiryService.deleteInquiry(inquiry.id).subscribe({
      next: () => {
        this.inquiries.update((list) => list.filter((i) => i.id !== inquiry.id));
        this.toastService.success('Inquiry deleted.');
      },
      error: (error) => {
        logger.error(`[AdminInquiriesManagerComponent] Failed to delete inquiry "${inquiry.id}"`, error);
        this.toastService.error('Failed to delete inquiry.');
      },
    });
  }
}
