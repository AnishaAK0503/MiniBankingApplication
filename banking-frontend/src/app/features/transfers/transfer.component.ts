import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Account } from '../../core/models/account.model';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { Transfer, TransferCreate } from '../../core/models/transfer.model';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { ToastService } from '../../shared/services/toast.service';
import { AccountSelectComponent } from '../../shared/components/account-select/account-select.component';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AccountSelectComponent],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.css',
})
export class TransferComponent {
  private readonly api = inject(BankingApiService);
  private readonly toast = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly permissions = inject(RolePermissionsService);

  accounts: Account[] = [];
  beneficiaries: Beneficiary[] = [];
  transfers: Transfer[] = [];
  loading = true;
  saving = false;
  error = '';
  showReview = false;
  showInsufficientBalance = false;
  showSuccess = false;
  showFailure = false;
  failureMessage = '';
  completedTransfer: Transfer | null = null;
  form: TransferCreate & { destinationType: 'beneficiary' | 'account'; destinationId: number } = {
    sourceAccountId: 0,
    amount: 0,
    description: '',
    destinationType: 'beneficiary',
    destinationId: 0,
  };

  constructor() {
    this.load();
  }

  get sourceAccount(): Account | undefined {
    return this.accounts.find((account) => account.id === this.form.sourceAccountId);
  }

  get destinationAccount(): Account | undefined {
    return this.form.destinationType === 'account'
      ? this.accounts.find((account) => account.id === this.form.destinationId)
      : undefined;
  }

  get beneficiary(): Beneficiary | undefined {
    return this.form.destinationType === 'beneficiary'
      ? this.beneficiaries.find((item) => item.id === this.form.destinationId)
      : undefined;
  }

  get destinationAccounts(): Account[] {
    return this.accounts.filter((account) => account.id !== this.form.sourceAccountId);
  }

  get availableBeneficiaries(): Beneficiary[] {
    const sourceCustomerId = this.sourceAccount?.customerId;
    return sourceCustomerId
      ? this.beneficiaries.filter((item) => item.customerId === sourceCustomerId)
      : this.beneficiaries;
  }

  load(): void {
    this.loading = true;
    forkJoin({ accounts: this.api.getAccounts(), beneficiaries: this.api.getBeneficiaries(), transfers: this.api.getTransfers() }).subscribe({
      next: ({ accounts, beneficiaries, transfers }) => {
        this.accounts = accounts;
        this.beneficiaries = beneficiaries;
        this.transfers = transfers;
        if (!this.form.sourceAccountId) this.form.sourceAccountId = accounts[0]?.id ?? 0;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        this.loading = false;
        this.error = this.message(error);
        this.toast.show(this.error, 'error');
        this.changeDetector.detectChanges();
      },
    });
  }

  review(): void {
    this.error = '';
    if (!this.form.sourceAccountId || !this.form.destinationId || !this.form.amount || this.form.amount <= 0) {
      this.error = 'Select a source and destination account, then enter an amount greater than zero.';
      return;
    }
    if (this.form.destinationType === 'account' && this.form.destinationId === this.form.sourceAccountId) {
      this.error = 'Source and destination accounts cannot be the same.';
      return;
    }
    if (this.sourceAccount && this.form.amount > (this.sourceAccount.balance ?? 0)) {
      this.showInsufficientBalance = true;
      return;
    }
    this.showReview = true;
  }

  confirmTransfer(): void {
    this.showReview = false;
    this.saving = true;
    const request: TransferCreate = {
      sourceAccountId: this.form.sourceAccountId,
      amount: this.form.amount,
      description: this.form.description,
      ...(this.form.destinationType === 'account'
        ? { destinationAccountId: this.form.destinationId }
        : { destinationAccountNumber: this.beneficiary?.accountNumber }),
    };
    this.api.createTransfer(request).subscribe({
      next: (transfer) => {
        this.saving = false;
        this.completedTransfer = transfer;
        this.transfers = [transfer, ...this.transfers];
        this.showSuccess = transfer.status === 'COMPLETED';
        if (transfer.status === 'FAILED') {
          this.failureMessage = transfer.rejectionReason || 'The transfer could not be completed.';
          if (this.failureMessage.toLowerCase().includes('insufficient balance')) {
            this.showInsufficientBalance = true;
          } else {
            this.showFailure = true;
          }
        }
        this.form.amount = 0;
        this.form.description = '';
        this.toast.show(transfer.status === 'COMPLETED' ? 'Transfer completed successfully.' : 'Transfer submitted for approval.');
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        this.saving = false;
        const message = this.message(error);
        if (message.toLowerCase().includes('insufficient balance')) {
          this.showInsufficientBalance = true;
        } else {
          this.failureMessage = message;
          this.showFailure = true;
        }
        this.changeDetector.detectChanges();
      },
    });
  }

  closeDialogs(): void {
    this.showReview = false;
    this.showInsufficientBalance = false;
    this.showSuccess = false;
    this.showFailure = false;
  }

  accountLabel(account: Account): string {
    return `${account.customerName ?? 'Account'} — ${this.mask(account.accountNumber)}`;
  }

  mask(value: string): string {
    if (!value) return '';
    return `••••${value.slice(-4)}`;
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object') return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the transfer.';
  }
}
