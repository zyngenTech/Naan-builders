import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ServiceOfferingService } from '../../../../core/services/service.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ServiceModel } from '../../../../core/models/service.model';
import { logger } from '../../../../core/logger';

/** Full CRUD for the "services" collection (Home + Services page cards). */
@Component({
  selector: 'app-admin-services-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-services-manager.component.html',
  styleUrl: './admin-services-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminServicesManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceOfferingService = inject(ServiceOfferingService);
  private toastService = inject(ToastService);

  readonly services = signal<ServiceModel[]>([]);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly iconOptions = [
    'fa-solid fa-house-chimney', 'fa-solid fa-ruler-combined', 'fa-solid fa-drafting-compass',
    'fa-solid fa-house-crack', 'fa-solid fa-couch', 'fa-solid fa-helmet-safety',
    'fa-solid fa-trowel-bricks', 'fa-solid fa-hammer',
  ];

  readonly serviceForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['fa-solid fa-house-chimney', Validators.required],
    order: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    logger.log('[AdminServicesManagerComponent] Loading services');
    this.loadServices();
  }

  private loadServices(): void {
    this.isLoading.set(true);
    this.serviceOfferingService.getAllServices().subscribe({
      next: (services) => {
        this.services.set(services);
        this.isLoading.set(false);
      },
      error: (error) => {
        logger.error('[AdminServicesManagerComponent] Failed to load services', error);
        this.isLoading.set(false);
      },
    });
  }

  get f() {
    return this.serviceForm.controls;
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.serviceForm.reset({ icon: 'fa-solid fa-house-chimney', order: this.services().length + 1 });
    this.showForm.set(true);
  }

  openEditForm(service: ServiceModel): void {
    this.editingId.set(service.id ?? null);
    this.serviceForm.reset({
      title: service.title,
      description: service.description,
      icon: service.icon,
      order: service.order ?? 1,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  onSubmit(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields.');
      return;
    }

    const payload = this.serviceForm.getRawValue();
    this.isSaving.set(true);
    const id = this.editingId();

    if (id) {
      logger.log(`[AdminServicesManagerComponent] Updating service "${id}"`, payload);
      this.serviceOfferingService.updateService(id, payload).subscribe({
        next: () => this.onSaveSuccess('Service updated.'),
        error: (error) => this.onSaveError(error),
      });
    } else {
      logger.log('[AdminServicesManagerComponent] Creating new service', payload);
      this.serviceOfferingService.saveService(payload).subscribe({
        next: () => this.onSaveSuccess('Service added.'),
        error: (error) => this.onSaveError(error),
      });
    }
  }

  private onSaveSuccess(message: string): void {
    this.toastService.success(message);
    this.isSaving.set(false);
    this.showForm.set(false);
    this.loadServices();
  }

  private onSaveError(error: unknown): void {
    logger.error('[AdminServicesManagerComponent] Save failed', error);
    this.toastService.error('Failed to save service.');
    this.isSaving.set(false);
  }

  deleteService(service: ServiceModel): void {
    if (!service.id) return;
    if (!confirm(`Delete "${service.title}"?`)) return;

    logger.log(`[AdminServicesManagerComponent] Deleting service "${service.id}"`);
    this.serviceOfferingService.deleteService(service.id).subscribe({
      next: () => {
        this.toastService.success('Service deleted.');
        this.loadServices();
      },
      error: (error) => {
        logger.error(`[AdminServicesManagerComponent] Failed to delete service "${service.id}"`, error);
        this.toastService.error('Failed to delete service.');
      },
    });
  }
}
