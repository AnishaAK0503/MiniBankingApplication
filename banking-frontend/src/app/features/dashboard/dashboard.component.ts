import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, retry, timeout } from 'rxjs';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';

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
  stats = { customers: 0, accounts: 0, transactions: 0, beneficiaries: 0, balance: 0 };
  error = '';
  private customerId = 0;

  get currentUser() {
    return this.auth.getCurrentUser();
  }

  get userName(): string {
    return this.currentUser?.name?.toUpperCase() ?? 'USER';
  }

  get userRole(): string {
    return this.currentUser?.role?.toUpperCase() ?? 'CUSTOMER';
  }

  get initials(): string {
    return this.auth.getInitials(this.currentUser?.name ?? 'User');
  }

  constructor() {
    afterNextRender(() => this.loadStats());
  }

  private loadStats(): void {
    this.api
      .getCustomers()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 5000 }))
      .subscribe({
        next: (customers) => {
          const user = this.currentUser;
          const customer =
            user?.role === 'customer'
              ? customers.find(
                  (item) =>
                    item.email.toLowerCase() === user.email.toLowerCase() ||
                    item.name.toLowerCase() === user.name.toLowerCase(),
                )
              : undefined;
          this.customerId = customer?.id ?? 0;
          this.stats.customers = user?.role === 'customer' ? (customer ? 1 : 0) : customers.length;
          this.changeDetector.detectChanges();
        },
        error: () => (this.error = 'Customer count could not be loaded.'),
      });

    this.api
      .getBeneficiaries()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 5000 }))
      .subscribe({
        next: (beneficiaries) => {
          this.stats.beneficiaries =
            this.currentUser?.role === 'customer'
              ? beneficiaries.filter((item) => item.customerId === this.customerId).length
              : beneficiaries.length;
          this.changeDetector.detectChanges();
        },
        error: () => (this.error = 'Beneficiary count could not be loaded.'),
      });

    this.api
      .getAccounts()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 5000 }))
      .subscribe({
        next: (accounts) => {
          const visibleAccounts =
            this.currentUser?.role === 'customer'
              ? accounts.filter((account) => account.customerId === this.customerId)
              : accounts;
          this.stats.accounts = visibleAccounts.length;
          this.stats.balance = visibleAccounts.reduce(
            (total, account) => total + account.balance,
            0,
          );
          this.changeDetector.detectChanges();
          this.loadTransactionCount(visibleAccounts);
        },
        error: () => (this.error = 'Account count could not be loaded.'),
      });
  }

  private loadTransactionCount(accounts: { id: number }[]): void {
    if (!accounts.length) {
      this.stats.transactions = 0;
      return;
    }

    forkJoin(
      accounts.map((account) =>
        this.api.getTransactions(account.id).pipe(
          retry({ count: 2, delay: 500 }),
          timeout({ each: 5000 }),
          catchError(() => of([])),
        ),
      ),
    ).subscribe((histories) => {
      this.stats.transactions = histories.reduce((total, history) => total + history.length, 0);
      this.changeDetector.detectChanges();
    });
  }
}
