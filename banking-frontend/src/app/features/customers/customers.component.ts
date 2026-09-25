import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Customer } from '../../core/models/customer.model';
import { ToastService } from '../../shared/services/toast.service';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { retry, timeout } from 'rxjs';
import { RolePermissionsService } from '../../core/services/role-permissions.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
})
export class CustomersComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  readonly permissions = inject(RolePermissionsService);
  customers: Customer[] = [];
  requests: any[] = [];
  loading = true;
  error = '';
  readonly pageSize = 10;
  currentPage = 1;
  saving = false;
  showForm = false;
  deleteTarget: Customer | null = null;
  deleteReason = '';
  deleting = false;
  searchTerm = '';
  form = { name: '', email: '', phone: '' };

  constructor() {
    afterNextRender(() => this.load());
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCustomers.length / this.pageSize));
  }
  get filteredCustomers(): Customer[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.customers;
    return this.customers.filter((customer) =>
      [customer.name, customer.email, customer.phone].some((value) => value?.toLowerCase().includes(term)),
    );
  }
  get visibleCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCustomers.length);
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api
      .getCustomers()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 10000 }))
      .subscribe({
        next: (data) => {
          this.customers = data;
          if (this.permissions.isMaker) this.api.getCustomerRequests().subscribe({ next: (requests) => this.requests = requests });
          this.currentPage = 1;
          this.loading = false;
          this.toast.show('Customer list loaded.');
          this.changeDetector.detectChanges();
        },
        error: (err) => {
          this.error = this.message(err);
          this.loading = false;
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  createCustomer(): void {
    this.saving = true;
    this.error = '';
    const request = this.permissions.isMaker ? this.api.createCustomerRequest(this.form) : this.api.createCustomer(this.form);
    request.subscribe({
      next: (customer) => {
        if (this.permissions.isAdmin) this.customers = [customer, ...this.customers];
        else this.requests = [customer, ...this.requests];
        this.form = { name: '', email: '', phone: '' };
        this.showForm = false;
        this.saving = false;
        this.toast.show(this.permissions.isMaker ? 'Customer request submitted for checker approval.' : 'Customer profile created.');
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        this.error = this.message(err);
        this.saving = false;
        this.toast.show(this.error, 'error');
        this.changeDetector.detectChanges();
      },
    });
  }

  removeCustomer(): void {
    if (!this.deleteTarget || !this.deleteReason.trim()) return;
    this.deleting = true;
    this.api.deleteCustomer(this.deleteTarget.id, this.deleteReason.trim()).subscribe({
      next: () => {
        this.customers = this.customers.filter((customer) => customer.id !== this.deleteTarget?.id);
        this.deleteTarget = null;
        this.deleteReason = '';
        this.deleting = false;
        this.toast.show('Customer deleted and workflow notifications sent.');
        this.changeDetector.detectChanges();
      },
      error: (err) => { this.deleting = false; this.toast.show(this.message(err), 'error'); this.changeDetector.detectChanges(); },
    });
  }

  exportCsv(): void {
    this.csv.download(
      'customers.csv',
      ['Name', 'Email', 'Phone'],
      this.customers.map((customer) => [customer.name, customer.email, customer.phone]),
    );
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object')
      return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}
