import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { Customer } from '../../core/models/customer.model';
import { Account } from '../../core/models/account.model';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { ToastService } from '../../shared/services/toast.service';
import { retry, timeout } from 'rxjs';
import { CsvExportService } from '../../shared/services/csv-export.service';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiaries.component.html',
  styleUrl: './beneficiaries.component.css',
})
export class BeneficiariesComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly permissions = inject(RolePermissionsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  beneficiaries: Beneficiary[] = [];
  private allBeneficiaries: Beneficiary[] = [];
  customers: Customer[] = [];
  accounts: Account[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';
  readonly pageSize = 10;
  currentPage = 1;

  form = { name: '', accountNumber: '', bankName: '', customerId: 0 };

  constructor() {
    afterNextRender(() => {
      this.load();
      this.api.getCustomers().subscribe({
        next: (data) => {
          this.customers = data;
          this.filterOwnBeneficiaries(data);
          const user = this.auth.getCurrentUser();
          const customer = data.find(
            (item) =>
              item.email.toLowerCase() === user?.email.toLowerCase() ||
              item.name.toLowerCase() === user?.name.toLowerCase(),
          );
          if (user?.role === 'customer' && customer) this.form.customerId = customer.id;
        },
        error: (err) => (this.error = this.message(err)),
      });
      this.api.getAccounts().subscribe({ next: (data) => (this.accounts = data) });
    });
  }

  customerName(customerId: number): string {
    return this.customers.find((customer) => customer.id === customerId)?.name ?? 'Customer';
  }

  customerAccountNumber(customerId: number): string {
    return this.accounts.find((account) => account.customerId === customerId)?.accountNumber ?? '-';
  }

  private filterOwnBeneficiaries(customers: Customer[]): void {
    const user = this.auth.getCurrentUser();
    if (user?.role !== 'customer') return;
    const customer = customers.find(
      (item) =>
        item.email.toLowerCase() === user.email.toLowerCase() ||
        item.name.toLowerCase() === user.name.toLowerCase(),
    );
    this.beneficiaries = this.allBeneficiaries.filter((item) => item.customerId === customer?.id);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.beneficiaries.length / this.pageSize));
  }
  get visibleBeneficiaries(): Beneficiary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.beneficiaries.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.beneficiaries.length);
  }

  load(): void {
    this.loading = true;
    this.api
      .getBeneficiaries()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 10000 }))
      .subscribe({
        next: (data) => {
          this.allBeneficiaries = data;
          this.beneficiaries = data;
          this.filterOwnBeneficiaries(this.customers);
          this.currentPage = 1;
          this.loading = false;
          this.toast.show('Beneficiary list loaded.');
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

  exportCsv(): void {
    this.csv.download(
      'beneficiaries.csv',
      ['Name', 'Account', 'Bank', 'Customer', 'Customer Account'],
      this.beneficiaries.map((item) => [
        item.name,
        item.accountNumber,
        item.bankName,
        this.customerName(item.customerId),
        this.customerAccountNumber(item.customerId),
      ]),
    );
  }

  createBeneficiary(): void {
    const user = this.auth.getCurrentUser();
    if (this.permissions.isMaker) {
      const list = JSON.parse(localStorage.getItem('mini-banking-beneficiary-requests') ?? '[]');
      const request = {
        id: Date.now(),
        customerId:
          this.form.customerId ||
          this.customers.find(
            (item) =>
              item.email.toLowerCase() === user?.email.toLowerCase() ||
              item.name.toLowerCase() === user?.name.toLowerCase(),
          )?.id ||
          0,
        name: this.form.name,
        accountNumber: this.form.accountNumber,
        bankName: this.form.bankName,
        status: 'PENDING_APPROVAL',
        createdBy: user?.name ?? 'Maker',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('mini-banking-beneficiary-requests', JSON.stringify([...list, request]));
      this.form = { name: '', accountNumber: '', bankName: '', customerId: 0 };
      this.toast.show('Beneficiary request submitted for checker approval.');
      this.changeDetector.detectChanges();
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';
    this.api
      .createBeneficiary(this.form)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: (item) => {
          this.allBeneficiaries = [...this.allBeneficiaries, item];
          this.beneficiaries = [...this.beneficiaries, item];
          this.currentPage = Math.ceil(this.beneficiaries.length / this.pageSize);
          this.loading = false;
          this.form = { name: '', accountNumber: '', bankName: '', customerId: 0 };
          this.success = 'Beneficiary added successfully.';
          this.saving = false;
          this.toast.show('Beneficiary saved successfully.');
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

  remove(item: Beneficiary): void {
    if (!confirm(`Delete ${item.name}?`)) return;
    this.api
      .deleteBeneficiary(item.id)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: () => {
          this.beneficiaries = this.beneficiaries.filter((value) => value.id !== item.id);
          this.currentPage = Math.min(this.currentPage, this.totalPages);
          this.success = 'Beneficiary deleted.';
          this.toast.show('Beneficiary deleted successfully.');
          this.changeDetector.detectChanges();
        },
        error: (err) => {
          this.error = this.message(err);
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object')
      return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}
