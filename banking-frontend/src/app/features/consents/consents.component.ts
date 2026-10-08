import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { Account } from '../../core/models/account.model';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { ToastService } from '../../shared/services/toast.service';
import { catchError, of, retry, timeout, finalize } from 'rxjs';

@Component({
  selector: 'app-consents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consents.component.html',
  styleUrl: './consents.component.css',
})
export class ConsentsComponent {
  private readonly api = inject(BankingApiService);
  private readonly auth = inject(AuthService);
  readonly permissions = inject(RolePermissionsService);
  private readonly toast = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  requests: any[] = [];
  loading = false;
  accounts: Account[] = [];
  beneficiaries: Beneficiary[] = [];
  rejectionRequestId: number | null = null;
  rejectionReason = '';
  form = {
    accountId: 0,
    beneficiaryId: 0,
    consentType: 'PAYMENT' as const,
    amount: 0,
  };
  selectedCustomer = signal<number | null>(null);

  constructor() {
    this.load();
  }

  errorMessage(error: any, fallback: string): string {
    const body = error?.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.error) return body.error;
    if (error?.message) return error.message;
    return fallback;
  }

  load(): void {
    this.loading = true;
    this.api.getConsents().pipe(
      retry({ count: 2, delay: 500 }),
      timeout({ each: 10000 }),
      catchError((error) => {
        this.toast.show(error?.status === 403
          ? 'Your role is not allowed to view consent requests.'
          : 'Unable to load consent requests.', 'error');
        return of([]);
      }),
      finalize(() => { this.loading = false; }),
    ).subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
        this.changeDetector.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.changeDetector.detectChanges();
      },
    });


    if (!this.permissions.isCustomer) return;

    this.api.getAccounts().pipe(
      retry({ count: 2, delay: 500 }),
      timeout({ each: 10000 }),
      catchError(() => {
        this.toast.show('Unable to load accounts.', 'error');
        return of([]);
      }),
    ).subscribe({
      next: (accounts) => {
        const currentUser = this.auth.getCurrentUser();
        this.accounts = currentUser?.name
          ? accounts.filter((account) =>
              account.customerName?.trim().toLowerCase() === currentUser.name.trim().toLowerCase(),
            )
          : accounts;
      },
    });

    this.api.getBeneficiaries().pipe(
      retry({ count: 2, delay: 500 }),
      timeout({ each: 10000 }),
      catchError(() => of([])),
    ).subscribe({
      next: (beneficiaries) => { this.beneficiaries = beneficiaries; },
    });
  }

  get customerAccounts(): Account[] {
    return this.accounts;
  }

  canSubmit(): boolean {
    return this.form.accountId > 0
      && !!this.form.consentType
      && (this.form.consentType !== 'PAYMENT'
        || (this.form.beneficiaryId > 0 && this.form.amount > 0));
  }

  createConsent(): void {
    if (!this.canSubmit()) {
      this.toast.show('Select an account and consent type.', 'error');
      return;
    }

    this.api.createConsent({
      accountId: this.form.accountId,
      beneficiaryId: this.form.beneficiaryId || undefined,
      consentType: this.form.consentType,
      amount: this.form.amount,
    }).subscribe({
      next: () => {
        this.toast.show('Consent request submitted for approval.');
        this.form = { accountId: 0, beneficiaryId: 0, consentType: 'PAYMENT', amount: 0 };
        this.load();
      },
      error: (error: any) => this.toast.show(this.errorMessage(error, 'Could not create consent request.'), 'error'),
    });
  }

  revokeConsent(id: number): void {
    this.api.revokeConsent(id).subscribe({
      next: () => {
        this.toast.show('Consent revoked.');
        this.load();
      },
      error: (error: any) => this.toast.show(this.errorMessage(error, 'Could not revoke consent.'), 'error'),
    });
  }

  approveConsent(id: number): void {
    this.api.approveConsent(id).subscribe({
      next: () => {
        this.toast.show('Consent approved.');
        this.load();
      },
      error: (error: any) => this.toast.show(this.errorMessage(error, 'Could not approve consent.'), 'error'),
    });
  }

  startRejectConsent(id: number): void {
    this.rejectionRequestId = id;
    this.rejectionReason = '';
  }

  cancelRejectConsent(): void {
    this.rejectionRequestId = null;
    this.rejectionReason = '';
  }

  rejectConsent(id: number): void {
    const reason = this.rejectionReason.trim();
    if (!reason) {
      this.toast.show('Rejection reason is required.', 'error');
      return;
    }
    this.api.rejectConsent(id, reason.trim()).subscribe({
      next: () => {
        this.toast.show('Consent rejected.');
        this.cancelRejectConsent();
        this.load();
      },
      error: (error: any) => this.toast.show(this.errorMessage(error, 'Could not reject consent.'), 'error'),
    });
  }
}
