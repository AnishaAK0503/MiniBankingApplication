import { Injectable, inject } from '@angular/core';
import { AuthService, UserRole } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RolePermissionsService {
  private readonly auth = inject(AuthService);

  get role(): UserRole {
    return this.auth.getCurrentUser()?.role ?? 'maker';
  }
  get isMaker(): boolean {
    return this.role === 'maker';
  }
  get isChecker(): boolean {
    return this.role === 'checker';
  }
  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get canManageCustomers(): boolean {
    return this.isMaker || this.isChecker || this.isAdmin;
  }
  get canManageAccounts(): boolean {
    return this.isMaker || this.isAdmin;
  }
  get canCreateTransactions(): boolean {
    return this.isMaker || this.isAdmin;
  }
  get canManageBeneficiaries(): boolean {
    return this.isMaker || this.isChecker || this.isAdmin;
  }
  get canReviewTransactions(): boolean {
    return this.isChecker || this.isAdmin;
  }

  get canTransfer(): boolean {
    return this.isMaker || this.isAdmin;
  }
  get canManageUsers(): boolean {
    return this.isAdmin;
  }
  get canViewAuditLogs(): boolean {
    return this.isAdmin;
  }
  get canRequestAccount(): boolean {
    return this.isMaker;
  }
  get canReviewAccountRequests(): boolean {
    return this.isMaker || this.isChecker || this.isAdmin;
  }
}
