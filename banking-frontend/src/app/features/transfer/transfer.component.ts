import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { forkJoin, retry, timeout } from 'rxjs';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.css'
})
export class TransferComponent {
  private readonly api = inject(BankingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  accounts: any[] = [];
  beneficiaries: any[] = [];
  form = { accountId: 0, beneficiaryId: 0, amount: 0, description: '' };
  loading = true;
  submitting = false;
  error = '';

  constructor() {
    forkJoin({ customers: this.api.getCustomers(), accounts: this.api.getAccounts(), beneficiaries: this.api.getBeneficiaries() })
      .pipe(retry({ count: 2, delay: 500 }), timeout({ each: 10000 }))
      .subscribe({
        next: ({ customers, accounts, beneficiaries }) => {
          const user = this.auth.getCurrentUser();
          const customer = customers.find(item => item.email.toLowerCase() === user?.email.toLowerCase() || item.name.toLowerCase() === user?.name.toLowerCase());
          this.accounts = accounts.filter(item => item.customerId === customer?.id);
          this.beneficiaries = beneficiaries.filter(item => item.customerId === customer?.id);
          this.loading = false;
        },
        error: () => this.fail('Unable to load your transfer data.')
      });
  }

  submit(): void {
    if (!this.form.accountId || !this.form.beneficiaryId || this.form.amount <= 0) { this.error = 'Select an account, beneficiary, and valid amount.'; return; }
    this.submitting = true;
    const request = { id: Date.now(), ...this.form, status: 'PENDING_APPROVAL', createdBy: this.auth.getCurrentUser()?.name ?? 'Customer' };
    const saved = JSON.parse(localStorage.getItem('mini-banking-transfer-requests') ?? '[]');
    localStorage.setItem('mini-banking-transfer-requests', JSON.stringify([...saved, request]));
    this.writeAudit('CREATE_TRANSFER_REQUEST', request.id, request.createdBy);
    this.submitting = false;
    this.form = { accountId: 0, beneficiaryId: 0, amount: 0, description: '' };
    this.toast.show('Transfer request submitted for checker approval.');
  }

  private fail(message: string): void { this.error = message; this.loading = false; this.toast.show(message, 'error'); }

  private writeAudit(action: string, entity: number, user: string): void {
    const logs = JSON.parse(localStorage.getItem('mini-banking-audit-logs') ?? '[]');
    logs.unshift({ user, action, entity: `Transfer request #${entity}`, time: new Date().toLocaleString() });
    localStorage.setItem('mini-banking-audit-logs', JSON.stringify(logs));
  }
}
