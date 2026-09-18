import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountRequest } from '../../core/models/account-request.model';
import { ToastService } from '../../shared/services/toast.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { CsvExportService } from '../../shared/services/csv-export.service';

@Component({
  selector: 'app-account-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-requests.component.html',
  styleUrl: './account-requests.component.css',
})
export class AccountRequestsComponent {
  private readonly api = inject(BankingApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly csv = inject(CsvExportService);
  readonly permissions = inject(RolePermissionsService);
  requests: AccountRequest[] = [];
  loading = true;
  submitting = 0;
  error = '';
  readonly pageSize = 10;
  currentPage = 1;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getAccountRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.currentPage = 1;
        this.loading = false;
        this.error = '';
        this.changeDetector.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.message(err);
        this.toast.show(this.error, 'error');
        this.changeDetector.detectChanges();
      },
    });
  }

  submit(request: AccountRequest): void {
    this.submitting = request.id;
    this.api
      .submitAccountRequest(request.id, this.auth.getCurrentUser()?.name ?? 'Maker')
      .subscribe({
        next: (updated) => {
          this.requests = this.requests.map((item) => (item.id === updated.id ? updated : item));
          this.submitting = 0;
          this.toast.show('Account request submitted for checker approval.');
          this.changeDetector.detectChanges();
          this.load();
        },
        error: () => {
          this.submitting = 0;
          this.toast.show('Unable to submit account request.', 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  displayType(type: string): string {
    return type?.toUpperCase() === 'CURRENT' || type?.toUpperCase() === 'CHECKING'
      ? 'Current Account'
      : 'Savings Account';
  }
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.requests.length / this.pageSize));
  }
  get visibleRequests(): AccountRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.requests.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.requests.length);
  }
  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }
  exportCsv(): void {
    this.csv.download(
      'account-requests.csv',
      ['Request', 'Customer', 'Type', 'Requested', 'Status', 'Remarks'],
      this.requests.map((request) => [
        request.id,
        request.customerName,
        this.displayType(request.accountType),
        request.requestedAt,
        request.status,
        request.remarks || '',
      ]),
    );
  }
  private message(error: any): string {
    return typeof error?.error === 'string'
      ? error.error
      : 'Unable to load account requests. Make sure the backend is running.';
  }
}
