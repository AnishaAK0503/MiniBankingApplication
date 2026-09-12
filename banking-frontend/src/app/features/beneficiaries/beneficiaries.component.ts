import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Beneficiary } from '../../core/models/beneficiary.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-beneficiaries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './beneficiaries.component.html',
  styleUrl: './beneficiaries.component.css'
})
export class BeneficiariesComponent {
  private readonly api = inject(BankingApiService);
  beneficiaries: Beneficiary[] = [];
  customers: Customer[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';

  form = { name: '', accountNumber: '', bankName: '', customerId: 0 };

  constructor() {
    this.load();
    this.api.getCustomers().subscribe({
      next: data => this.customers = data,
      error: err => this.error = this.message(err)
    });
  }

  load(): void {
    this.loading = true;
    this.api.getBeneficiaries().subscribe({
      next: data => {
        this.beneficiaries = data;
        this.loading = false;
      },
      error: err => {
        this.error = this.message(err);
        this.loading = false;
      }
    });
  }

  createBeneficiary(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api.createBeneficiary(this.form).subscribe({
      next: item => {
        this.beneficiaries = [...this.beneficiaries, item];
        this.form = { name: '', accountNumber: '', bankName: '', customerId: 0 };
        this.success = 'Beneficiary added successfully.';
        this.saving = false;
      },
      error: err => {
        this.error = this.message(err);
        this.saving = false;
      }
    });
  }

  remove(item: Beneficiary): void {
    if (!confirm(`Delete ${item.name}?`)) return;
    this.api.deleteBeneficiary(item.id).subscribe({
      next: () => {
        this.beneficiaries = this.beneficiaries.filter(value => value.id !== item.id);
        this.success = 'Beneficiary deleted.';
      },
      error: err => this.error = this.message(err)
    });
  }

  private message(error: any): string {
    if (error?.error && typeof error.error === 'object') return Object.values(error.error).join(' ');
    return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.';
  }
}