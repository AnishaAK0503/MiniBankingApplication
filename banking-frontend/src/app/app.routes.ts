import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { CustomersComponent } from './features/customers/customers.component';
import { AccountsComponent } from './features/accounts/accounts.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { BeneficiariesComponent } from './features/beneficiaries/beneficiaries.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ApprovalsComponent } from './features/approvals/approvals.component';
import { AuditLogsComponent } from './features/audit-logs/audit-logs.component';
import { AccountRequestsComponent } from './features/account-requests/account-requests.component';
import { UsersComponent } from './features/users/users.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { roleGuard } from './core/guards/role.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'customers',
    component: CustomersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['maker', 'checker', 'admin'] },
  },
  { path: 'accounts', component: AccountsComponent, canActivate: [authGuard] },
  {
    path: 'account-requests',
    component: AccountRequestsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['maker'] },
  },
  { path: 'transactions', component: TransactionsComponent, canActivate: [authGuard] },
  {
    path: 'accounts/:accountId/transactions',
    component: TransactionsComponent,
    canActivate: [authGuard],
  },
  { path: 'beneficiaries', component: BeneficiariesComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  {
    path: 'approvals',
    component: ApprovalsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['checker', 'admin'] },
  },
  {
    path: 'approvals/:id',
    component: ApprovalsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['checker', 'admin'] },
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'audit-logs',
    component: AuditLogsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  { path: '**', redirectTo: 'login' },
];
