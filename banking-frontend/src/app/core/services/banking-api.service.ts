import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models/account.model';
import { Beneficiary } from '../models/beneficiary.model';
import { Customer } from '../models/customer.model';
import { Transaction, TransactionApprovalRequest } from '../models/transaction.model';
import { AccountRequest } from '../models/account-request.model';
import { Notification } from '../models/notification.model';
import { Transfer, TransferCreate } from '../models/transfer.model';

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
  getBeneficiaryAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.apiUrl}/accounts/beneficiary-options`);
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

  createTransactionRequest(request: { accountId: number; amount: number; type: string; description?: string }): Observable<TransactionApprovalRequest> {
    return this.http.post<TransactionApprovalRequest>(`${this.apiUrl}/transaction-requests`, request);
  }

  getTransactionRequests(): Observable<TransactionApprovalRequest[]> {
    return this.http.get<TransactionApprovalRequest[]>(`${this.apiUrl}/transaction-requests`);
  }

  getPendingTransactionRequests(): Observable<TransactionApprovalRequest[]> {
    return this.http.get<TransactionApprovalRequest[]>(`${this.apiUrl}/transaction-requests/pending-approval`);
  }

  approveTransactionRequest(id: number): Observable<TransactionApprovalRequest> {
    return this.http.put<TransactionApprovalRequest>(`${this.apiUrl}/transaction-requests/${id}/approve`, {});
  }

  rejectTransactionRequest(id: number, rejectionReason: string): Observable<TransactionApprovalRequest> {
    return this.http.put<TransactionApprovalRequest>(`${this.apiUrl}/transaction-requests/${id}/reject`, { rejectionReason });
  }

  getBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.apiUrl}/beneficiaries`);
  }
  getAuditLogs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/audit-logs`);
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

  submitCustomerRequest(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer-requests/${id}/submit`, {});
  }

  approveCustomerRequest(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer-requests/${id}/approve`, {});
  }

  rejectCustomerRequest(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/customer-requests/${id}/reject`, null, { params: { reason } });
  }

  getConsents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consents`);
  }

  getPendingConsents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/consents/pending-approval`);
  }

  createConsent(request: { accountId: number; beneficiaryId?: number; consentType: string; amount?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/consents`, request);
  }

  approveConsent(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/consents/${id}/approve`, {});
  }

  rejectConsent(id: number, rejectionReason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/consents/${id}/reject`, {
      decision: 'REJECT',
      rejectionReason,
    });
  }

  revokeConsent(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/consents/${id}/revoke`, {});
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

  createTransfer(request: TransferCreate): Observable<Transfer> {
    return this.http.post<Transfer>(`${this.apiUrl}/transfers`, request);
  }

  getTransfers(): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.apiUrl}/transfers`);
  }

  getPendingTransfers(): Observable<Transfer[]> {
    return this.http.get<Transfer[]>(`${this.apiUrl}/transfers/pending-approval`);
  }

  approveTransfer(id: number): Observable<Transfer> {
    return this.http.put<Transfer>(`${this.apiUrl}/transfers/${id}/approve`, {});
  }

  rejectTransfer(id: number, rejectionReason: string): Observable<Transfer> {
    return this.http.put<Transfer>(`${this.apiUrl}/transfers/${id}/reject`, { rejectionReason });
  }
}
