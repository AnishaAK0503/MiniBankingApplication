import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models/account.model';
import { Beneficiary } from '../models/beneficiary.model';
import { Customer } from '../models/customer.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class BankingApiService {
  
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCustomers(): Observable<Customer[]> { return this.http.get<Customer[]>(`${this.apiUrl}/customers`); }
  createCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> { return this.http.post<Customer>(`${this.apiUrl}/customers`, customer); }
  
  getAccounts(): Observable<Account[]> { return this.http.get<Account[]>(`${this.apiUrl}/accounts`); }
  getAccount(id: number): Observable<Account> { return this.http.get<Account>(`${this.apiUrl}/accounts/${id}`); }
  createAccount(account: Omit<Account, 'id' | 'customerName'>): Observable<Account> { return this.http.post<Account>(`${this.apiUrl}/accounts`, account); }
  
  getTransactions(accountId: number): Observable<Transaction[]> { return this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${accountId}/transactions`); }
  createTransaction(accountId: number, transaction: Pick<Transaction, 'amount' | 'type' | 'description'>): Observable<Transaction> { return this.http.post<Transaction>(`${this.apiUrl}/accounts/${accountId}/transactions`, transaction); }
  
  getBeneficiaries(): Observable<Beneficiary[]> { return this.http.get<Beneficiary[]>(`${this.apiUrl}/beneficiaries`); }
  createBeneficiary(beneficiary: Omit<Beneficiary, 'id'>): Observable<Beneficiary> { return this.http.post<Beneficiary>(`${this.apiUrl}/beneficiaries`, beneficiary); }
  deleteBeneficiary(id: number): Observable<string> { return this.http.delete(`${this.apiUrl}/beneficiaries/${id}`, { responseType: 'text' }); }
}
