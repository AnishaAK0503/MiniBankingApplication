import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AccountRequest } from '../../core/models/account-request.model';
import { AuthService } from '../../core/services/auth.service';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { retry, timeout } from 'rxjs';

interface RequestItem {
  id: number;
  amount: number;
  description: string;
  status: string;
  createdBy: string;
}
interface PendingApprovalItem {
  id: number;
  type: 'account' | 'transaction' | 'beneficiary';
  customerName: string;
  displayName: string;
  createdBy: string;
  createdAt: string;
  status: string;
  remarks?: string;
  amount?: number;
  description?: string;
  accountType?: string;
  request: AccountRequest | RequestItem | any;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrl: './approvals.component.css',
})
export class ApprovalsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly api = inject(BankingApiService);
  private readonly auth = inject(AuthService);
  private readonly csv = inject(CsvExportService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  requests: RequestItem[] = [];
  accountRequests: AccountRequest[] = [];
  pendingItems: PendingApprovalItem[] = [];
  selectedId = Number(this.route.snapshot.paramMap.get('id'));
  rejectionReason: Record<number, string> = {};
  rejectingRequestId: number | null = null;
  loading = false;
  error = '';
  readonly pageSize = 10;
  currentPage = 1;

  constructor() {
    this.load();
    this.loadAccountRequests();
  }

  load(): void {
    const stored = JSON.parse(localStorage.getItem('mini-banking-transfer-requests') ?? '[]');
    const normalized = stored.map((request: RequestItem) =>
      (request.status ?? '').trim().toUpperCase() === 'PENDING'
        ? { ...request, status: 'PENDING_APPROVAL' }
        : request,
    );
    if (JSON.stringify(normalized) !== JSON.stringify(stored)) {
      localStorage.setItem('mini-banking-transfer-requests', JSON.stringify(normalized));
    }
    this.requests = normalized.filter(
      (request: RequestItem) => (request.status ?? '').trim().toUpperCase() === 'PENDING_APPROVAL',
    );
    this.buildPendingItems();
  }

  loadAccountRequests(): void {
    this.loading = true;
    this.error = '';
    this.api
      .getPendingAccountRequests()
      .pipe(retry({ count: 2, delay: 500 }), timeout({ each: 5000 }))
      .subscribe({
        next: (data) => {
          this.accountRequests = data.filter(
            (request: AccountRequest) =>
              (request.status ?? '').trim().toUpperCase() === 'PENDING_APPROVAL',
          );
          this.loading = false;
          this.buildPendingItems();
          this.changeDetector.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.error = 'Unable to load account approvals. Check that the backend is running.';
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  refresh(): void {
    this.load();
    this.loadAccountRequests();
  }

  private buildPendingItems(): void {
    const beneficiaryRequests = JSON.parse(
      localStorage.getItem('mini-banking-beneficiary-requests') ?? '[]',
    )
      .filter((request: any) => (request.status ?? '').trim().toUpperCase() === 'PENDING_APPROVAL')
      .map((request: any) => ({
        id: Number(request.id),
        type: 'beneficiary' as const,
        customerName: request.customerName || 'Customer',
        displayName: request.name || 'Beneficiary request',
        createdBy: request.createdBy || 'Maker',
        createdAt: request.createdAt || new Date().toISOString(),
        status: request.status,
        remarks: request.bankName || 'Beneficiary request',
        request,
      }));

    this.pendingItems = [
      ...this.accountRequests.map((request: AccountRequest) => ({
        id: Number(request.id),
        type: 'account' as const,
        customerName: request.customerName || 'Customer',
        displayName: this.displayType(request.accountType),
        createdBy: request.reviewedByMaker || 'Maker',
        createdAt: request.requestedAt || new Date().toISOString(),
        status: request.status,
        remarks: request.remarks || 'No remarks',
        accountType: request.accountType,
        request,
      })),
      ...this.requests.map((request: RequestItem) => ({
        id: Number(request.id),
        type: 'transaction' as const,
        customerName: 'Customer',
        displayName: request.description || 'Transaction request',
        createdBy: request.createdBy || 'Maker',
        createdAt: new Date().toISOString(),
        status: request.status,
        amount: request.amount,
        description: request.description,
        request,
      })),
      ...beneficiaryRequests,
    ];
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.pendingItems.length / this.pageSize));
  }
  get visiblePendingItems(): PendingApprovalItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.pendingItems.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.pendingItems.length);
  }
  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }
  exportCsv(): void {
    this.csv.download(
      'pending-approvals.csv',
      ['Type', 'Customer', 'Request', 'Created By', 'Created At', 'Status', 'Remarks'],
      this.pendingItems.map((item) => [
        item.type,
        item.customerName,
        item.displayName,
        item.createdBy,
        item.createdAt,
        item.status,
        item.remarks || '',
      ]),
    );
  }

  approveAccount(request: AccountRequest): void {
    this.api
      .approveAccountRequest(request.id, this.auth.getCurrentUser()?.name ?? 'Checker')
      .subscribe({
        next: () => {
          this.accountRequests = this.accountRequests.filter((item) => item.id !== request.id);
          this.buildPendingItems();
          this.toast.show('Account approved and created successfully.');
        },
        error: () => this.toast.show('Unable to approve account request.', 'error'),
      });
  }

  rejectAccount(request: AccountRequest): void {
    this.rejectingRequestId = request.id;
    this.rejectionReason[request.id] = this.rejectionReason[request.id] ?? '';
  }

  submitReject(request: AccountRequest): void {
    const reason = (this.rejectionReason[request.id] ?? '').trim();
    if (!reason) {
      this.toast.show('Rejection reason is required.', 'error');
      return;
    }

    this.api
      .rejectAccountRequest(request.id, this.auth.getCurrentUser()?.name ?? 'Checker', reason)
      .subscribe({
        next: () => {
          this.accountRequests = this.accountRequests.filter((item) => item.id !== request.id);
          this.rejectingRequestId = null;
          this.rejectionReason[request.id] = '';
          this.buildPendingItems();
          this.toast.show('Account request rejected.');
        },
        error: () => this.toast.show('Unable to reject account request.', 'error'),
      });
  }

  cancelReject(): void {
    this.rejectingRequestId = null;
  }

  displayType(type: string): string {
    return type?.toUpperCase() === 'CURRENT' || type?.toUpperCase() === 'CHECKING'
      ? 'Current Account'
      : 'Savings Account';
  }

  approveItem(item: PendingApprovalItem): void {
    if (item.type === 'account') return this.approveAccount(item.request as AccountRequest);

    const all = JSON.parse(
      localStorage.getItem(
        item.type === 'transaction'
          ? 'mini-banking-transfer-requests'
          : 'mini-banking-beneficiary-requests',
      ) ?? '[]',
    );
    const updated = all.map((request: any) =>
      request.id === item.id ? { ...request, status: 'APPROVED' } : request,
    );
    localStorage.setItem(
      item.type === 'transaction'
        ? 'mini-banking-transfer-requests'
        : 'mini-banking-beneficiary-requests',
      JSON.stringify(updated),
    );
    this.requests = JSON.parse(
      localStorage.getItem('mini-banking-transfer-requests') ?? '[]',
    ).filter(
      (request: RequestItem) => (request.status ?? '').trim().toUpperCase() === 'PENDING_APPROVAL',
    );
    this.load();
    this.loadAccountRequests();
    this.toast.show(
      `${item.type === 'transaction' ? 'Transaction' : 'Beneficiary'} approved successfully.`,
    );
  }

  rejectItem(item: PendingApprovalItem): void {
    if (item.type === 'account') return this.rejectAccount(item.request as AccountRequest);

    this.rejectingRequestId = item.id;
    this.rejectionReason[item.id] = this.rejectionReason[item.id] ?? '';
  }

  submitRejectItem(item: PendingApprovalItem): void {
    const reason = (this.rejectionReason[item.id] ?? '').trim();
    if (!reason) {
      this.toast.show('Rejection reason is required.', 'error');
      return;
    }

    if (item.type === 'account') return this.submitReject(item.request as AccountRequest);

    const storageKey =
      item.type === 'transaction'
        ? 'mini-banking-transfer-requests'
        : 'mini-banking-beneficiary-requests';
    const all = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    const updated = all.map((request: any) =>
      request.id === item.id
        ? { ...request, status: 'REJECTED', rejectionReason: reason }
        : request,
    );
    localStorage.setItem(storageKey, JSON.stringify(updated));
    this.rejectingRequestId = null;
    this.rejectionReason[item.id] = '';
    this.load();
    this.loadAccountRequests();
    this.toast.show(
      `${item.type === 'transaction' ? 'Transaction' : 'Beneficiary'} request rejected.`,
    );
  }

  decide(item: RequestItem, status: 'APPROVED' | 'REJECTED'): void {
    const all = JSON.parse(localStorage.getItem('mini-banking-transfer-requests') ?? '[]');
    const updated = all.map((request: RequestItem) =>
      request.id === item.id ? { ...request, status } : request,
    );
    localStorage.setItem('mini-banking-transfer-requests', JSON.stringify(updated));
    const logs = JSON.parse(localStorage.getItem('mini-banking-audit-logs') ?? '[]');
    logs.unshift({
      user: 'Current Checker',
      action: `${status}_REQUEST`,
      entity: `Transfer request #${item.id}`,
      time: new Date().toLocaleString(),
    });
    localStorage.setItem('mini-banking-audit-logs', JSON.stringify(logs));
    this.requests = updated.filter(
      (request: RequestItem) => (request.status ?? '').trim().toUpperCase() === 'PENDING_APPROVAL',
    );
    this.buildPendingItems();
    this.toast.show(`Request ${status.toLowerCase()} successfully.`);
  }
}
