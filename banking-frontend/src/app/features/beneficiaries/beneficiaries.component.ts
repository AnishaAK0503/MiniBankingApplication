import { afterNextRender, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { Customer } from '../../core/models/customer.model';
import { Account } from '../../core/models/account.model';
import { AuthService } from '../../core/services/auth.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { ToastService } from '../../shared/services/toast.service';
import { retry, timeout } from 'rxjs';
import { CsvExportService } from '../../shared/services/csv-export.service';
import { AccountSelectComponent } from '../../shared/components/account-select/account-select.component';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, FormsModule, AccountSelectComponent],
  templateUrl: './beneficiaries.component.html',
  styleUrl: './beneficiaries.component.css',
})
export class BeneficiariesComponent {
  private readonly api = inject(BankingApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly permissions = inject(RolePermissionsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly csv = inject(CsvExportService);
  beneficiaries: Beneficiary[] = [];
  private allBeneficiaries: Beneficiary[] = [];
  customers: Customer[] = [];
  accounts: Account[] = [];
  loading = true;
  saving = false;
  showForm = false;
  error = '';
  success = '';
  formError = '';
  readonly pageSize = 10;
  currentPage = 1;
  selectedCustomerFilter = 0;
  deleteTarget: Beneficiary | null = null;

  form = { name: '', accountNumber: '', confirmAccountNumber: '', bankName: '', ifsc: '', customerId: 0, customerAccountId: 0, internalAccountId: 0 };
  beneficiaryMode: 'internal' | 'external' = 'internal';

  constructor() {
    afterNextRender(() => {
      this.load();
      this.api.getCustomers().subscribe({
        next: (data) => {
          this.customers = data;
          this.syncCustomerSelection();
          this.filterOwnBeneficiaries(data);
        },
        error: (err) => (this.error = this.message(err)),
      });
      this.api.getBeneficiaryAccounts().subscribe({
        next: (data) => {
          this.accounts = [...this.accounts, ...data].filter(
            (account, index, all) => all.findIndex((item) => item.id === account.id) === index,
          );
          this.syncCustomerSelection();
        },
      });
    });
  }

  customerName(customerId: number): string {
    return this.customers.find((customer) => customer.id === customerId)?.name ?? 'Customer';
  }

  customerAccountNumber(customerId: number): string {
    const accountNumber = this.accounts.find((account) => account.customerId === customerId)?.accountNumber;
    return accountNumber ? this.maskAccount(accountNumber) : '-';
  }

  onInternalAccountChange(): void {
    const account = this.accounts.find((item) => item.id === this.form.internalAccountId);
    if (!account) return;
    this.form.name = account.customerName;
    this.form.accountNumber = account.accountNumber;
    this.form.confirmAccountNumber = account.accountNumber;
    this.form.bankName = 'Mini Banking';
    this.form.ifsc = 'MINI0INTERNAL';
  }

  canSubmitBeneficiary(): boolean {
    if (!this.form.customerId) return false;
    if (this.beneficiaryMode === 'internal') return this.form.internalAccountId > 0;
    return !!this.form.name.trim()
      && /^[0-9]{6,18}$/.test(this.form.accountNumber)
      && this.form.accountNumber === this.form.confirmAccountNumber
      && !!this.form.bankName.trim()
      && /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(this.form.ifsc);
  }

  maskAccount(accountNumber: string): string {
    return `••••${accountNumber.slice(-4)}`;
  }

  get customerAccounts(): Account[] {
    if (!this.form.customerId) return [];
    return this.accounts.filter((account) => account.customerId === this.form.customerId);
  }

  get availableInternalAccounts(): Account[] {
    return this.accounts.filter((account) => account.customerId !== this.form.customerId);
  }

  get displayBeneficiaries(): Beneficiary[] {
    if (!this.selectedCustomerFilter) return this.beneficiaries;
    return this.beneficiaries.filter((beneficiary) => beneficiary.customerId === this.selectedCustomerFilter);
  }

  onCustomerFilterChange(customerId: number): void {
    this.selectedCustomerFilter = customerId;
    this.beneficiaries = this.selectedCustomerFilter
      ? this.allBeneficiaries.filter((beneficiary) => beneficiary.customerId === this.selectedCustomerFilter)
      : this.allBeneficiaries;
    this.currentPage = 1;
  }

  onCustomerSelectionChange(): void {
    const customerAccounts = this.customerAccounts;
    this.form.customerAccountId = customerAccounts[0]?.id ?? 0;
  }

  private filterOwnBeneficiaries(customers: Customer[]): void {
    this.beneficiaries = this.allBeneficiaries;
    if (this.selectedCustomerFilter) {
      this.onCustomerFilterChange(this.selectedCustomerFilter);
    }
  }

  private syncCustomerSelection(): void {
    if (!this.form.customerId && this.customers.length) {
      const linkedCustomer = this.customers.find(
        (customer) =>
          customer.email.toLowerCase() === this.auth.getCurrentUser()?.email.toLowerCase() ||
          customer.name.toLowerCase() === this.auth.getCurrentUser()?.name.toLowerCase(),
      );
      if (linkedCustomer) {
        this.form.customerId = linkedCustomer.id;
        this.onCustomerSelectionChange();
      }
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.beneficiaries.length / this.pageSize));
  }
  get visibleBeneficiaries(): Beneficiary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.beneficiaries.slice(start, start + this.pageSize);
  }
  get pageStart(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.beneficiaries.length);
  }

  load(): void {
    this.loading = true;
    this.api
      .getBeneficiaries()
      .pipe(retry({ count: 4, delay: 1000 }), timeout({ each: 10000 }))
      .subscribe({
        next: (data) => {
          this.allBeneficiaries = data;
          this.beneficiaries = data;
          this.filterOwnBeneficiaries(this.customers);
          this.currentPage = 1;
          this.loading = false;
          this.toast.show('Beneficiary list loaded.');
          this.changeDetector.detectChanges();
        },
        error: (err) => {
          this.error = this.message(err);
          this.loading = false;
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  exportCsv(): void {
    const rows = this.displayBeneficiaries;
    this.csv.download(
      'beneficiaries.csv',
      ['Name', 'Account', 'Bank', 'Customer', 'Customer Account'],
      rows.map((item) => [
        item.name,
        item.accountNumber,
        item.bankName,
        this.customerName(item.customerId),
        this.customerAccountNumber(item.customerId),
      ]),
    );
  }

  createBeneficiary(): void {
    if (this.beneficiaryMode === 'external' && this.form.accountNumber !== this.form.confirmAccountNumber) {
      this.formError = 'Account numbers do not match.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.formError = '';
    this.success = '';
    const payload = {
      name: this.form.name,
      accountNumber: this.form.accountNumber,
      confirmAccountNumber: this.form.confirmAccountNumber,
      bankName: this.form.bankName,
      ifsc: this.form.ifsc,
      customerId: this.form.customerId,
      internalAccountId: this.beneficiaryMode === 'internal' ? this.form.internalAccountId : undefined,
    };
    this.api
      .createBeneficiary(payload)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: (item) => {
          this.allBeneficiaries = [...this.allBeneficiaries, item];
          this.beneficiaries = [...this.beneficiaries, item];
          this.currentPage = Math.ceil(this.beneficiaries.length / this.pageSize);
          this.loading = false;
          this.form = { name: '', accountNumber: '', confirmAccountNumber: '', bankName: '', ifsc: '', customerId: 0, customerAccountId: 0, internalAccountId: 0 };
          this.beneficiaryMode = 'internal';
          this.showForm = false;
          this.formError = '';
          this.success = 'Beneficiary added successfully.';
          this.saving = false;
          this.toast.show('Beneficiary saved successfully.');
          this.changeDetector.detectChanges();
        },
        error: (err) => {
          this.error = this.message(err);
          this.saving = false;
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  remove(item: Beneficiary): void {
    this.deleteTarget = item;
  }

  confirmRemove(): void {
    if (!this.deleteTarget) return;
    const item = this.deleteTarget;
    this.api
      .deleteBeneficiary(item.id)
      .pipe(timeout({ each: 10000 }))
      .subscribe({
        next: () => {
          this.beneficiaries = this.beneficiaries.filter((value) => value.id !== item.id);
          this.allBeneficiaries = this.allBeneficiaries.filter((value) => value.id !== item.id);
          this.deleteTarget = null;
          this.currentPage = Math.min(this.currentPage, this.totalPages);
          this.success = 'Beneficiary deleted.';
          this.toast.show('Beneficiary deleted successfully.');
          this.changeDetector.detectChanges();
        },
        error: (err) => {
          this.error = this.message(err);
          this.toast.show(this.error, 'error');
          this.changeDetector.detectChanges();
        },
      });
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object')
      return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}
