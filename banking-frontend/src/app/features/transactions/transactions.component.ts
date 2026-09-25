import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Transaction } from '../../core/models/transaction.model';
import { Account } from '../../core/models/account.model';
import { Customer } from '../../core/models/customer.model';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { ToastService } from '../../shared/services/toast.service';
import { forkJoin, retry, timeout } from 'rxjs';
import { CsvExportService } from '../../shared/services/csv-export.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css',
})
export class TransactionsComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  readonly permissions = inject(RolePermissionsService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  customers: Customer[] = [];
  selectedCustomerId = 0;
  accountId = 0;
  loading = false;
  saving = false;
  error = '';
  success = '';
  readonly pageSize = 10;
  currentPage = 1;

  form = { amount: 0, type: '', description: '' };

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.transactions.length / this.pageSize));
  }
  get visibleTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.transactions.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.transactions.length);
  }

  get selectedAccount(): Account | undefined {
    return this.accounts.find((account) => account.id === this.accountId);
  }

  get customerAccounts(): Account[] {
    if (!this.selectedCustomerId) return this.accounts;
    return this.accounts.filter((account) => account.customerId === this.selectedCustomerId);
  }

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('accountId'));
    if (id) this.accountId = id;
    afterNextRender(() => {
      forkJoin({ accounts: this.api.getAccounts(), customers: this.api.getCustomers() })
        .pipe(timeout({ each: 10000 }))
        .subscribe({
          next: ({ accounts, customers }) => {
            this.customers = customers;
            this.accounts = accounts;
            if (this.accountId) this.load();
            this.changeDetector.detectChanges();
          },
          error: (err) => {
            this.error = this.message(err);
            this.changeDetector.detectChanges();
          },
        });
    });
  }

  accountLabel(account: Account): string {
    const holder =
      account.customerName ||
      this.customers.find((customer) => customer.id === account.customerId)?.name ||
      'Unknown holder';
    return `${holder} | ${account.accountNumber}`;
  }

  displayType(value: string): string {
    return value?.toUpperCase() === 'DEBIT' || value?.toUpperCase() === 'WITHDRAWAL'
      ? 'Withdrawal'
      : value?.toUpperCase() === 'CREDIT' || value?.toUpperCase() === 'DEPOSIT'
        ? 'Deposit'
        : value || '-';
  }

  load(): void {
    if (!this.accountId || this.accountId < 1) {
      this.error = 'Enter a valid account ID.';
      return;
    }
    this.loading = true;
    this.error = '';
    forkJoin({ account: this.api.getAccount(this.accountId), customers: this.api.getCustomers() })
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: ({ account, customers }) => {
          this.api
            .getTransactions(this.accountId)
            .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 10000 }))
            .subscribe({
              next: (data) => {
                this.transactions = data;
                this.currentPage = 1;
                this.loading = false;
                this.toast.show(
                  `History loaded for ${this.selectedAccount?.customerName || 'account'} - ${this.selectedAccount?.accountNumber || this.accountId}.`,
                );
                this.changeDetector.detectChanges();
              },
              error: (err) => {
                this.error = this.message(err);
                this.loading = false;
                this.toast.show(this.error, 'error');
                this.changeDetector.detectChanges();
              },
            });
        },
        error: (err) => {
          this.error = this.message(err);
          this.loading = false;
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  selectCustomer(customerId: number): void {
    this.selectedCustomerId = Number(customerId) || 0;
    this.accountId = 0;
    this.transactions = [];
    this.error = '';
    this.success = '';
    if (!this.selectedCustomerId) return;
    const firstAccount = this.customerAccounts[0];
    if (firstAccount) {
      this.accountId = firstAccount.id;
      this.load();
    }
  }

  selectAccount(id: number): void {
    this.accountId = Number(id);
    if (this.accountId) this.load();
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  exportCsv(): void {
    this.csv.download(
      'transactions.csv',
      ['Date', 'Type', 'Description', 'Amount'],
      this.transactions.map((transaction) => [
        transaction.createdAt,
        this.displayType(transaction.type),
        transaction.description || '',
        transaction.amount,
      ]),
    );
  }

  createTransaction(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api
      .createTransaction(this.accountId, this.form)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: (transaction) => {
          this.transactions = [transaction, ...this.transactions];
          this.currentPage = 1;
          this.form = { amount: 0, type: '', description: '' };
          this.success = 'Transaction recorded successfully.';
          this.saving = false;
          this.toast.show('Transaction saved successfully.');
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

  private message(error: any): string {
    if (error?.name === 'TimeoutError')
      return 'The request took too long. Check that the backend and database are running, then try again.';
    if (error?.error && typeof error.error === 'object')
      return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}
