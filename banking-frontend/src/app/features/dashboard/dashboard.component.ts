import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BankingApiService } from '../../core/services/banking-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly api = inject(BankingApiService);
  stats = { customers: 0, accounts: 0, transactions: 0, beneficiaries: 0, balance: 0 };
  error = '';

  constructor() {
    forkJoin({
      customers: this.api.getCustomers(),
      accounts: this.api.getAccounts(),
      beneficiaries: this.api.getBeneficiaries()
    }).subscribe({
      next: ({ customers, accounts, beneficiaries }) => {
        this.stats.customers = customers.length;
        this.stats.accounts = accounts.length;
        this.stats.beneficiaries = beneficiaries.length;
        this.stats.balance = accounts.reduce((total, account) => total + account.balance, 0);
        if (accounts.length) {
          forkJoin(accounts.map(account => this.api.getTransactions(account.id))).subscribe({
            next: histories => this.stats.transactions = histories.reduce((total, history) => total + history.length, 0),
            error: () => this.error = 'Some transaction statistics could not be loaded.'
          });
        }
      },
      error: () => this.error = 'Dashboard data could not be loaded. Check that the backend is running.'
    });
  }
}