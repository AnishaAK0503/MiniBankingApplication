import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, retry, timeout } from 'rxjs';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { Account } from '../../core/models/account.model';
import { Transaction } from '../../core/models/transaction.model';
import { AccountRequest } from '../../core/models/account-request.model';

interface BarItem { label: string; value: number; }
interface StatusItem { label: string; value: number; color: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly permissions = inject(RolePermissionsService);

  accounts: Account[] = [];
  transactions: Transaction[] = [];
  customers: any[] = [];
  beneficiaries: any[] = [];
  accountRequests: AccountRequest[] = [];
  transactionRequests: any[] = [];
  consents: any[] = [];
  transfers: any[] = [];
  loading = true;
  error = '';

  get currentUser() { return this.auth.getCurrentUser(); }
  get userName(): string { return this.currentUser?.name ?? 'User'; }
  get greeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }
  get roleLabel(): string { return this.currentUser?.role ? this.currentUser.role.toUpperCase() : 'WORKSPACE'; }
  get isCustomer(): boolean { return this.permissions.isCustomer; }

  get balance(): number { return this.accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0); }
  get credits(): number { return this.transactions.filter((item) => item.type === 'CREDIT').reduce((sum, item) => sum + item.amount, 0); }
  get debits(): number { return this.transactions.filter((item) => item.type === 'DEBIT').reduce((sum, item) => sum + item.amount, 0); }
  get pendingCount(): number {
    return [...this.accountRequests, ...this.transactionRequests, ...this.consents, ...this.transfers]
      .filter((item) => ['PENDING', 'PENDING_APPROVAL'].includes(item.status)).length;
  }
  get createdToday(): number { return this.createdTodayCount(this.transactionRequests); }
  get rejectedCount(): number {
    return [...this.accountRequests, ...this.transactionRequests, ...this.consents, ...this.transfers]
      .filter((item) => item.status === 'REJECTED').length;
  }
  get approvedToday(): number {
    return this.approvedTodayCount([...this.accountRequests, ...this.transactionRequests, ...this.consents, ...this.transfers]);
  }
  get reviewedCount(): number {
    return [...this.accountRequests, ...this.transactionRequests, ...this.consents, ...this.transfers]
      .filter((item) => ['APPROVED', 'REJECTED', 'COMPLETED'].includes(item.status)).length;
  }

  get systemActivity(): BarItem[] {
    return [
      { label: 'Customers', value: this.customers.length },
      { label: 'Makers', value: this.uniqueActors(this.accountRequests) },
      { label: 'Checkers', value: this.uniqueReviewers([...this.accountRequests, ...this.transactionRequests, ...this.consents]) },
      { label: 'Admins', value: this.permissions.isAdmin ? 1 : 0 },
    ];
  }
  get transactionStatus(): StatusItem[] {
    return this.statusItems([...this.transactionRequests, ...this.transfers, ...this.transactions.map((item) => ({ status: item.type === 'DEBIT' || item.type === 'CREDIT' ? 'COMPLETED' : item.type }))]);
  }
  get approvalStatus(): StatusItem[] { return this.statusItems([...this.accountRequests, ...this.transactionRequests, ...this.consents]); }
  get requestActivity(): BarItem[] {
    return ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'].map((type) => ({
      label: this.readable(type),
      value: this.transactionRequests.filter((item) => item.type === type).length,
    }));
  }
  get balancePoints(): string {
    if (!this.transactions.length) return '0,72 100,72';
    const values = this.transactions.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((item) => item.balanceAfter ?? 0);
    const max = Math.max(...values, 1);
    return values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${70 - (value / max) * 55}`).join(' ');
  }
  get latestTransactions(): Transaction[] { return this.transactions.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3); }

  constructor() { afterNextRender(() => this.load()); }

  private load(): void {
    const requests = [
      this.api.getCustomers().pipe(catchError(() => of([]))),
      this.api.getAccounts().pipe(catchError(() => of([]))),
      this.api.getBeneficiaries().pipe(catchError(() => of([]))),
      this.api.getAccountRequests().pipe(catchError(() => of([]))),
      this.api.getTransactionRequests().pipe(catchError(() => of([]))),
      this.api.getConsents().pipe(catchError(() => of([]))),
      this.api.getTransfers().pipe(catchError(() => of([]))),
    ];
    forkJoin(requests).subscribe({
      next: ([customers, accounts, beneficiaries, accountRequests, transactionRequests, consents, transfers]) => {
        this.customers = customers;
        this.accounts = accounts;
        this.beneficiaries = beneficiaries;
        this.accountRequests = accountRequests;
        this.transactionRequests = transactionRequests;
        this.consents = consents;
        this.transfers = transfers;
        this.loadTransactions(accounts);
      },
      error: () => { this.error = 'Dashboard data could not be loaded.'; this.loading = false; },
    });
  }

  private loadTransactions(accounts: Account[]): void {
    const visibleAccounts = this.permissions.isCustomer
      ? accounts.filter((account) => account.customerName?.toLowerCase() === this.userName.toLowerCase())
      : accounts;
    this.accounts = visibleAccounts;
    if (!visibleAccounts.length) { this.loading = false; this.changeDetector.detectChanges(); return; }
    forkJoin(visibleAccounts.map((account) => this.api.getTransactions(account.id).pipe(catchError(() => of([]))))).subscribe((histories) => {
      this.transactions = histories.flat();
      this.loading = false;
      this.changeDetector.detectChanges();
    });
  }

  barWidth(value: number, items: BarItem[]): number {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (value / max) * 100;
  }
  statusPercent(value: number, items: StatusItem[]): number {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return total ? Math.round((value / total) * 100) : 0;
  }
  statusTotal(items: StatusItem[]): number { return items.reduce((sum, item) => sum + item.value, 0); }
  readable(value: string): string { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }

  private statusItems(items: any[]): StatusItem[] {
    return [
      { label: 'Pending', value: items.filter((item) => ['PENDING', 'PENDING_APPROVAL'].includes(item.status)).length, color: '#f59e0b' },
      { label: 'Approved', value: items.filter((item) => ['APPROVED', 'COMPLETED'].includes(item.status)).length, color: '#22c55e' },
      { label: 'Rejected', value: items.filter((item) => item.status === 'REJECTED').length, color: '#ef4444' },
    ];
  }
  private createdTodayCount(items: any[]): number { return items.filter((item) => item.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length; }
  private approvedTodayCount(items: any[]): number { return items.filter((item) => ['APPROVED', 'COMPLETED'].includes(item.status) && item.reviewedAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length; }
  private uniqueActors(items: any[]): number { return new Set(items.map((item) => item.requestedBy).filter(Boolean)).size; }
  private uniqueReviewers(items: any[]): number { return new Set(items.map((item) => item.approvedBy || item.reviewedByMaker).filter(Boolean)).size; }
}
