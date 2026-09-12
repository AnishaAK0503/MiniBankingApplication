import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent {
  private readonly api = inject(BankingApiService);
  private readonly route = inject(ActivatedRoute);
  transactions: Transaction[] = [];
  accountId = 0;
  loading = false;
  saving = false;
  error = '';
  success = '';

  form = { amount: 0, type: '', description: '' };

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('accountId'));
    if (id) {
      this.accountId = id;
      this.load();
    }
  }

  load(): void {
    if (!this.accountId || this.accountId < 1) {
      this.error = 'Enter a valid account ID.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.api.getTransactions(this.accountId).subscribe({
      next: data => {
        this.transactions = data;
        this.loading = false;
      },
      error: err => {
        this.error = this.message(err);
        this.loading = false;
      }
    });
  }

  createTransaction(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api.createTransaction(this.accountId, this.form).subscribe({
      next: transaction => {
        this.transactions = [transaction, ...this.transactions];
        this.form = { amount: 0, type: '', description: '' };
        this.success = 'Transaction recorded successfully.';
        this.saving = false;
      },
      error: err => {
        this.error = this.message(err);
        this.saving = false;
      }
    });
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object') return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}