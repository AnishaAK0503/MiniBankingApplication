import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AccountRequest } from '../../core/models/account-request.model';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { catchError, forkJoin, of } from 'rxjs';

interface ApprovalItem {
  kind: 'customer' | 'account' | 'transfer' | 'transaction' | 'consent';
  id: number;
  title: string;
  requestedBy: string;
  createdAt: string;
  status: string;
  detailPrimary: string;
  detailSecondary: string;
  request: AccountRequest | any;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css',
})
export class ApprovalsComponent {
  private readonly api = inject(BankingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  items: ApprovalItem[] = [];
  rejectionReason: Record<number, string> = {};
  rejectingId: number | null = null;
  loading = false;
  error = '';

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      accounts: this.api.getPendingAccountRequests().pipe(catchError(() => of([]))),
      customers: this.api.getPendingCustomerRequests().pipe(catchError(() => of([]))),
      transfers: this.api.getPendingTransfers().pipe(catchError(() => of([]))),
      transactions: this.api.getPendingTransactionRequests().pipe(catchError(() => of([]))),
      consents: this.api.getPendingConsents().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ accounts, customers, transfers, transactions, consents }) => {
            this.items = [
              ...customers.map((request) => this.customerItem(request)),
              ...accounts.map((request) => this.accountItem(request)),
              ...transfers.map((request) => this.transferItem(request)),
              ...transactions.map((request) => this.transactionItem(request)),
              ...consents.map((request) => this.consentItem(request)),
            ];
            this.loading = false;
            this.changeDetector.detectChanges();
      },
      error: () => this.fail('Unable to load pending approvals.'),
    });
  }

  approve(item: ApprovalItem): void {
    if (item.kind === 'customer') {
      this.api.approveCustomerRequest(item.id).subscribe({ next: () => { this.toast.show('Customer request approved.'); this.refresh(); }, error: (error: any) => this.toast.show(this.message(error), 'error') });
      return;
    }
    if (item.kind === 'account') {
      this.api.approveAccountRequest(item.id, this.auth.getCurrentUser()?.name ?? 'Checker').subscribe({
        next: () => { this.toast.show('Account request approved.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
      return;
    }
    if (item.kind === 'transfer') {
      this.api.approveTransfer(item.id).subscribe({
        next: () => { this.toast.show('Transfer approved.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
    }
    if (item.kind === 'transaction') {
      this.api.approveTransactionRequest(item.id).subscribe({
        next: () => { this.toast.show('Transaction request approved.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
      return;
    }
    if (item.kind === 'consent') {
      this.api.approveConsent(item.id).subscribe({
        next: () => { this.toast.show('Consent approved.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
    }
  }

  beginReject(item: ApprovalItem): void {
    this.rejectingId = item.id;
    this.rejectionReason[item.id] = '';
  }

  reject(item: ApprovalItem): void {
    const reason = (this.rejectionReason[item.id] ?? '').trim();
    if (!reason) {
      this.toast.show('Rejection reason is required.', 'error');
      return;
    }
    if (item.kind === 'customer') {
      this.api.rejectCustomerRequest(item.id, reason).subscribe({ next: () => { this.rejectingId = null; this.toast.show('Customer request rejected.'); this.refresh(); }, error: (error: any) => this.toast.show(this.message(error), 'error') });
      return;
    }
    if (item.kind === 'account') {
      this.api.rejectAccountRequest(item.id, this.auth.getCurrentUser()?.name ?? 'Checker', reason).subscribe({
        next: () => { this.rejectingId = null; this.toast.show('Account request rejected.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
      return;
    }
    if (item.kind === 'transfer') {
      this.api.rejectTransfer(item.id, reason).subscribe({
        next: () => { this.rejectingId = null; this.toast.show('Transfer rejected.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
    }
    if (item.kind === 'transaction') {
      this.api.rejectTransactionRequest(item.id, reason).subscribe({
        next: () => { this.rejectingId = null; this.toast.show('Transaction request rejected.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
      return;
    }
    if (item.kind === 'consent') {
      this.api.rejectConsent(item.id, reason).subscribe({
        next: () => { this.rejectingId = null; this.toast.show('Consent rejected.'); this.refresh(); },
        error: (error: any) => this.toast.show(this.message(error), 'error'),
      });
    }
  }

  private accountItem(request: AccountRequest): ApprovalItem {
    return {
      kind: 'account', id: request.id, title: 'Account request',
      requestedBy: request.reviewedByMaker ?? 'Maker', createdAt: request.requestedAt,
      status: request.status, detailPrimary: request.customerName, detailSecondary: request.accountType,
      request,
    };
  }

  private customerItem(request: any): ApprovalItem {
    return { kind: 'customer', id: request.id, title: 'Customer request', requestedBy: request.requestedBy, createdAt: request.createdAt, status: request.status, detailPrimary: request.name, detailSecondary: request.email, request };
  }

  private transferItem(request: any): ApprovalItem {
    return { kind: 'transfer', id: request.id, title: 'Transfer request', requestedBy: request.initiatedBy, createdAt: request.createdAt, status: request.status, detailPrimary: request.referenceNumber, detailSecondary: `₹${request.amount}`, request };
  }

  private transactionItem(request: any): ApprovalItem {
    return { kind: 'transaction', id: request.id, title: 'Transaction request', requestedBy: request.requestedBy, createdAt: request.createdAt, status: request.status, detailPrimary: `${request.type} ${request.amount}`, detailSecondary: request.accountNumber, request };
  }

  private consentItem(request: any): ApprovalItem {
    return {
      kind: 'consent',
      id: request.id,
      title: 'Consent request',
      requestedBy: request.requestedBy,
      createdAt: request.requestedAt,
      status: request.status,
      detailPrimary: request.consentType,
      detailSecondary: `${request.accountNumber}${request.beneficiaryName ? ' -> ' + request.beneficiaryName : ''}`,
      request,
    };
  }

  private fail(message: string): void {
    this.loading = false;
    this.error = message;
    this.toast.show(message, 'error');
    this.changeDetector.detectChanges();
  }

  private message(error: any): string {
    return typeof error?.error === 'string' ? error.error : 'Approval operation failed.';
  }
}
