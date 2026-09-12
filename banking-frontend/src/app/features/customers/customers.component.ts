import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent {
  private readonly api = inject(BankingApiService);
  customers: Customer[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';

  form = { name: '', email: '', phone: '' };

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.api.getCustomers().subscribe({
      next: data => {
        this.customers = data;
        this.loading = false;
      },
      error: err => {
        this.error = this.message(err);
        this.loading = false;
      }
    });
  }

  createCustomer(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api.createCustomer(this.form).subscribe({
      next: customer => {
        this.customers = [...this.customers, customer];
        this.form = { name: '', email: '', phone: '' };
        this.success = 'Customer created successfully.';
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