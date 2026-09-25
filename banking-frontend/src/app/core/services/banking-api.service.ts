import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models/account.model';
import { Beneficiary } from '../models/beneficiary.model';
import { Customer } from '../models/customer.model';
import { Transaction } from '../models/transaction.model';
import { AccountRequest } from '../models/account-request.model';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class BankingApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/customers`);
  }

  createCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers`, customer);
  }

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts`);
  }
  deleteCustomer(id: number, reason: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/customers/${id}`, { body: { reason } });
  }
  deleteAccount(id: number, reason: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/accounts/${id}`, { body: { reason } });
  }
  getAccount(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/accounts/${id}`);
  }
  createAccount(account: Omit<Account, 'id' | 'customerName'>): Observable<Account> {
    return this.http.post<Account>(`${this.apiUrl}/accounts`, account);
  }

  getTransactions(accountId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/accounts/${accountId}/transactions`);
  }
  createTransaction(
    accountId: number,
    transaction: Pick<Transaction, 'amount' | 'type' | 'description'>,
  ): Observable<Transaction> {
    return this.http.post<Transaction>(
      `${this.apiUrl}/accounts/${accountId}/transactions`,
      transaction,
    );
  }

  getBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.apiUrl}/beneficiaries`);
  }
  createBeneficiary(beneficiary: Omit<Beneficiary, 'id'>): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(`${this.apiUrl}/beneficiaries`, beneficiary);
  }
  deleteBeneficiary(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/beneficiaries/${id}`, { responseType: 'text' });
  }

  createAccountRequest(
    request: Pick<AccountRequest, 'accountType' | 'remarks'> & { customerId?: number },
  ): Observable<AccountRequest> {
    return this.http.post<AccountRequest>(`${this.apiUrl}/account-requests`, request);
  }
  getAccountRequests(customerId?: number): Observable<AccountRequest[]> {
    const suffix = customerId ? `?customerId=${customerId}` : '';
    return this.http.get<AccountRequest[]>(`${this.apiUrl}/account-requests${suffix}`);
  }
  getPendingAccountRequests(): Observable<AccountRequest[]> {
    return this.http.get<AccountRequest[]>(`${this.apiUrl}/account-requests/pending-approval`);
  }
  submitAccountRequest(id: number, actorName: string): Observable<AccountRequest> {
    return this.http.put<AccountRequest>(`${this.apiUrl}/account-requests/${id}/submit`, {
      actorName,
    });
  }
  approveAccountRequest(id: number, actorName: string): Observable<AccountRequest> {
    return this.http.put<AccountRequest>(`${this.apiUrl}/account-requests/${id}/approve`, {
      actorName,
    });
  }
  rejectAccountRequest(
    id: number,
    actorName: string,
    rejectionReason: string,
  ): Observable<AccountRequest> {
    return this.http.put<AccountRequest>(`${this.apiUrl}/account-requests/${id}/reject`, {
      actorName,
      rejectionReason,
    });
  }

  createCustomerRequest(customer: Omit<Customer, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/customer-requests`, customer);
  }

  getCustomerRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customer-requests`);
  }

  getPendingCustomerRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/customer-requests/pending-approval`);
  }

  approveCustomerRequest(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer-requests/${id}/approve`, {});
  }

  rejectCustomerRequest(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer-requests/${id}/reject`, null, { params: { reason } });
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`);
  }

  getUnreadNotificationCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/notifications/unread-count`);
  }

  markNotificationRead(id: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/notifications/read-all`, {});
  }
}
