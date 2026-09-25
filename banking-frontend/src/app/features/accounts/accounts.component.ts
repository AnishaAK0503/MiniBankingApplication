import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Account } from '../../core/models/account.model';
import { AccountRequest } from '../../core/models/account-request.model';
import { Customer } from '../../core/models/customer.model';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { ToastService } from '../../shared/services/toast.service';
import { retry, timeout } from 'rxjs';
import { CsvExportService } from '../../shared/services/csv-export.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css',
})
export class AccountsComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly permissions = inject(RolePermissionsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  requests: AccountRequest[] = [];
  showRequestForm = false;
  showCreateForm = false;
  requestSaving = false;
  requestError = '';
  requestForm = { customerId: 0, accountType: 'SAVINGS', remarks: '' };
  accounts: Account[] = [];
  private allAccounts: Account[] = [];
  customers: Customer[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';
  readonly pageSize = 10;
  currentPage = 1;
  accountSearch = '';
  accountTypeFilter = 'ALL';
  accountStatusFilter = 'ALL';
  deleteTarget: Account | null = null;
  deleteReason = '';
  deleting = false;

  form = { accountNumber: '', accountType: '', balance: 0, customerId: 0 };
  get selectedHolderName(): string {
    return this.customers.find((customer) => customer.id === this.form.customerId)?.name ?? '';
  }

  displayAccountType(value: string): string {
    return value?.toUpperCase() === 'CHECKING'
      ? 'Current'
      : value?.toLowerCase() === 'savings'
        ? 'Savings'
        : value || '-';
  }
  constructor() {
    afterNextRender(() => {
      this.loadAccounts();
      this.api.getCustomers().subscribe({
        next: (data) => {
          this.customers = data;
          this.filterOwnAccounts(data);
        },
        error: (err) => (this.error = this.message(err)),
      });
    });
  }

  private customerId(): number | undefined {
    const user = this.auth.getCurrentUser();
    return this.customers.find(
      (customer) =>
        customer.email.toLowerCase() === user?.email.toLowerCase() ||
        customer.name.toLowerCase() === user?.name.toLowerCase(),
    )?.id;
  }

  loadOwnRequests(): void {
    this.api.getAccountRequests(this.customerId()).subscribe({
      next: (data) => {
        this.requests = data;
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        this.requestError = this.message(err);
        this.toast.show(this.requestError, 'error');
        this.changeDetector.detectChanges();
      },
    });
  }

  submitAccountRequest(): void {
    const id = this.requestForm.customerId || this.customerId();
    this.requestSaving = true;
    this.requestError = '';
    this.api
      .createAccountRequest({
        ...(id ? { customerId: id } : {}),
        accountType: this.requestForm.accountType,
        remarks: this.requestForm.remarks,
      })
      .subscribe({
        next: (request) => {
          this.api.submitAccountRequest(request.id, this.auth.getCurrentUser()?.name ?? 'Maker').subscribe({
            next: (submitted) => {
              this.requests = [submitted, ...this.requests];
              this.requestSaving = false;
              this.showRequestForm = false;
              this.requestForm = { customerId: 0, accountType: 'SAVINGS', remarks: '' };
              this.toast.show('Account request submitted successfully.');
              this.changeDetector.detectChanges();
            },
            error: (err) => {
              this.requestSaving = false;
              this.requestError = this.message(err);
              this.toast.show(this.requestError, 'error');
              this.changeDetector.detectChanges();
            },
          });
        },
        error: (err) => {
          this.requestSaving = false;
          this.requestError = this.message(err);
          this.toast.show(this.requestError, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  private filterOwnAccounts(customers: Customer[]): void {
    this.accounts = this.allAccounts;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAccounts.length / this.pageSize));
  }

  get filteredAccounts(): Account[] {
    const term = this.accountSearch.trim().toLowerCase();
    return this.accounts.filter((account) => {
      const matchesSearch = !term || [account.accountNumber, account.customerName, account.accountType].some((value) => value?.toLowerCase().includes(term));
      const matchesType = this.accountTypeFilter === 'ALL' || account.accountType?.toUpperCase() === this.accountTypeFilter;
      const matchesStatus = this.accountStatusFilter === 'ALL' || (account.status || 'ACTIVE').toUpperCase() === this.accountStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }

  get visibleAccounts(): Account[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAccounts.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAccounts.length);
  }

  loadAccounts(): void {
    this.loading = true;
    this.error = '';
    this.api
      .getAccounts()
      .pipe(timeout({ each: 5000 }), retry({ count: 4, delay: 1000 }))
      .subscribe({
        next: (data) => {
          this.allAccounts = data;
          this.accounts = data;
          this.filterOwnAccounts(this.customers);
          this.currentPage = 1;
          this.loading = false;
          this.toast.show('Account list loaded.');
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
      'accounts.csv',
      ['Account Number', 'Account Holder', 'Type', 'Balance'],
      this.accounts.map((account) => [
        account.accountNumber,
        account.customerName || 'Customer',
        this.displayAccountType(account.accountType),
        account.balance,
      ]),
    );
  }

  createAccount(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api
      .createAccount(this.form)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: (account) => {
          this.allAccounts = [...this.allAccounts, account];
          this.accounts = [...this.accounts, account];
          this.currentPage = Math.ceil(this.accounts.length / this.pageSize);
          this.loading = false;
          this.success = 'Account created successfully.';
          this.form = { accountNumber: '', accountType: '', balance: 0, customerId: 0 };
          this.showCreateForm = false;
          this.saving = false;
          this.toast.show('Account saved successfully.');
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

  removeAccount(): void {
    if (!this.deleteTarget || !this.deleteReason.trim()) return;
    this.deleting = true;
    this.api.deleteAccount(this.deleteTarget.id, this.deleteReason.trim()).subscribe({
      next: () => {
        this.allAccounts = this.allAccounts.filter((account) => account.id !== this.deleteTarget?.id);
        this.accounts = this.allAccounts;
        this.deleteTarget = null;
        this.deleteReason = '';
        this.deleting = false;
        this.toast.show('Account deleted and workflow notifications sent.');
        this.changeDetector.detectChanges();
      },
      error: (err) => { this.deleting = false; this.toast.show(this.message(err), 'error'); this.changeDetector.detectChanges(); },
    });
  }
  private message(error: any): string {
    if (error?.error && typeof error.error === 'object')
      return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}
