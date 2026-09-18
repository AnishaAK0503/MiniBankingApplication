import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Customer } from '../../core/models/customer.model';
import { ToastService } from '../../shared/services/toast.service';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { retry, timeout } from 'rxjs';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  customers: Customer[] = [];
  loading = true;
  error = '';
  readonly pageSize = 10;
  currentPage = 1;

  constructor() {
    afterNextRender(() => this.load());
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.customers.length / this.pageSize)); }
  get visibleCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.customers.slice(start, start + this.pageSize);
  }
  get pageStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.customers.length); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getCustomers().pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 10000 })).subscribe({
      next: data => {
        this.customers = data;
        this.currentPage = 1;
        this.loading = false;
        this.toast.show('Customer list loaded.');
        this.changeDetector.detectChanges();
      },
      error: err => {
        this.error = this.message(err);
        this.loading = false;
        this.toast.show(this.error, 'error');
        this.changeDetector.detectChanges();
      }
    });
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  exportCsv(): void {
    this.csv.download('customers.csv', ['Name', 'Email', 'Phone'], this.customers.map(customer => [customer.name, customer.email, customer.phone]));
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object') return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}