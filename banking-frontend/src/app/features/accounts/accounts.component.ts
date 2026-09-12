import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Account } from '../../core/models/account.model';
import { Customer } from '../../core/models/customer.model';

@Component({ 
    selector: 'app-accounts', 
    standalone: true, 
    imports: [CommonModule, FormsModule, RouterLink], 
    templateUrl: './accounts.component.html', 
    styleUrl: './accounts.component.css' 
})

export class AccountsComponent {
  private readonly api = inject(BankingApiService); 
  accounts: Account[] = []; 
  customers: Customer[] = []; 
  loading = true; 
  saving = false; 
  error = ''; 
  success = '';

  form = { accountNumber: '', accountType: '', balance: 0, customerId: 0 };
  constructor() { 
    this.loadAccounts(); 
    this.api.getCustomers().subscribe({ 
        next: data => this.customers = data, 
        error: err => this.error = this.message(err) }); 
    }
  loadAccounts(): void { 
    this.loading = true; 
    this.api.getAccounts().subscribe({ 
        next: data => { 
            this.accounts = data; 
            this.loading = false; 
        }, 
        error: err => { 
            this.error = this.message(err); 
            this.loading = false; 
        } 
    }); 
    }
  createAccount(): void { 
    this.saving = true; 
    this.error = ''; 
    this.success = ''; 
    this.api.createAccount(this.form).subscribe({ 
        next: account => { 
            this.accounts = [...this.accounts, account]; 
            this.success = 'Account created successfully.'; 
            this.form = { accountNumber: '', accountType: '', balance: 0, customerId: 0 }; 
            this.saving = false; 
        }, 
        error: err => { 
            this.error = this.message(err); 
            this.saving = false; 
        } 
    }); 
  }
  private message(error: any): string { if (error?.error && typeof error.error === 'object') return Object.values(error.error).join(' '); return typeof error?.error === 'string' ? error.error : 'Unable to complete the request.'; }
}