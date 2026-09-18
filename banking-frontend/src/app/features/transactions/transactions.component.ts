import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Transaction } from '../../core/models/transaction.model';
import { Account } from '../../core/models/account.model';
import { Customer } from '../../core/models/customer.model';
import { AuthService } from '../../core/services/auth.service';
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
  private readonly auth = inject(AuthService);
  readonly permissions = inject(RolePermissionsService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  customers: Customer[] = [];
  accountId = 0;
  loading = false;
  saving = false;
  error = '';
  success = '';
  readonly pageSize = 10;
  currentPage = 1;
  readonly makerRequestPageSize = 10;
  makerRequestCurrentPage = 1;

  form = { amount: 0, type: '', description: '' };

  get makerRequests(): Array<{
    id: number;
    accountId: number;
    amount: number;
    description: string;
    status: string;
    createdBy: string;
  }> {
    if (!this.permissions.isMaker) return [];
    const user = this.auth.getCurrentUser();
    return JSON.parse(localStorage.getItem('mini-banking-transfer-requests') ?? '[]').filter(
      (request: { createdBy: string }) => request.createdBy === user?.name,
    );
  }

  get makerRequestTotalPages(): number {
    return Math.max(1, Math.ceil(this.makerRequests.length / this.makerRequestPageSize));
  }
  get visibleMakerRequests(): Array<{
    id: number;
    accountId: number;
    amount: number;
    description: string;
    status: string;
    createdBy: string;
  }> {
    const start = (this.makerRequestCurrentPage - 1) * this.makerRequestPageSize;
    return this.makerRequests.slice(start, start + this.makerRequestPageSize);
  }
  get makerRequestPageStart(): number {
    return (this.makerRequestCurrentPage - 1) * this.makerRequestPageSize + 1;
  }
  get makerRequestPageEnd(): number {
    return Math.min(
      this.makerRequestCurrentPage * this.makerRequestPageSize,
      this.makerRequests.length,
    );
  }

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

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('accountId'));
    if (id) this.accountId = id;
    afterNextRender(() => {
      forkJoin({ accounts: this.api.getAccounts(), customers: this.api.getCustomers() })
        .pipe(timeout({ each: 10000 }))
        .subscribe({
          next: ({ accounts, customers }) => {
            this.customers = customers;
            const user = this.auth.getCurrentUser();
            const customer = customers.find(
              (item) =>
                item.email.toLowerCase() === user?.email.toLowerCase() ||
                item.name.toLowerCase() === user?.name.toLowerCase(),
            );
            this.accounts =
              user?.role === 'customer'
                ? accounts.filter((account) => account.customerId === customer?.id)
                : accounts;
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
          const user = this.auth.getCurrentUser();
          const customer = customers.find(
            (item) =>
              item.email.toLowerCase() === user?.email.toLowerCase() ||
              item.name.toLowerCase() === user?.name.toLowerCase(),
          );
          if (user?.role === 'customer' && account.customerId !== customer?.id) {
            this.error = 'You can only view transactions for your own account.';
            this.loading = false;
            this.toast.show(this.error, 'error');
            this.changeDetector.detectChanges();
            return;
          }
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

  exportMakerRequestsCsv(): void {
    this.csv.download(
      'transaction-requests.csv',
      ['Request', 'Account', 'Amount', 'Description', 'Status', 'Created By'],
      this.makerRequests.map((request) => [
        request.id,
        request.accountId,
        request.amount,
        request.description || '',
        request.status,
        request.createdBy,
      ]),
    );
  }

  goToMakerRequestPage(page: number): void {
    this.makerRequestCurrentPage = Math.min(Math.max(page, 1), this.makerRequestTotalPages);
  }

  createTransaction(): void {
    if (this.permissions.isMaker) {
      const user = JSON.parse(localStorage.getItem('mini-banking-current-user') ?? '{}');
      const requests = JSON.parse(localStorage.getItem('mini-banking-transfer-requests') ?? '[]');
      const request = {
        id: Date.now(),
        accountId: this.accountId,
        amount: this.form.amount,
        description: this.form.description,
        status: 'PENDING_APPROVAL',
        createdBy: user.name ?? 'Maker',
      };
      localStorage.setItem(
        'mini-banking-transfer-requests',
        JSON.stringify([...requests, request]),
      );
      const logs = JSON.parse(localStorage.getItem('mini-banking-audit-logs') ?? '[]');
      logs.unshift({
        user: request.createdBy,
        action: 'CREATE_TRANSACTION_REQUEST',
        entity: `Transaction request #${request.id}`,
        time: new Date().toLocaleString(),
      });
      localStorage.setItem('mini-banking-audit-logs', JSON.stringify(logs));
      this.toast.show('Transaction request submitted for checker approval.');
      this.form = { amount: 0, type: '', description: '' };
      this.changeDetector.detectChanges();
      return;
    }
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
