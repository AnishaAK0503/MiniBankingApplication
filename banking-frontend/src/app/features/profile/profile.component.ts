import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { afterNextRender, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BankingApiService } from '../../core/services/banking-api.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BankingApiService);
  readonly permissions = inject(RolePermissionsService);
  customer: Customer | null = null;
  profileError = '';
  passwordMessage = '';
  passwordError = '';
  passwordSaving = false;
  passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  constructor() {
    afterNextRender(() => {
      if (this.permissions.isCustomer) {
        this.api.getCustomers().subscribe({
          next: (customers) => this.customer = customers[0] ?? null,
          error: () => this.profileError = 'Banking profile details could not be loaded.',
        });
      }
    });
  }

  get user() {
    return this.auth.getCurrentUser();
  }

  get initials(): string {
    return this.auth.getInitials(this.user?.name ?? 'User');
  }

  get displayName(): string {
    return this.customer?.name ?? this.user?.name ?? 'User';
  }

  changePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'New password and confirmation must match.';
      return;
    }
    this.passwordSaving = true;
    this.api.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.passwordSaving = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.passwordMessage = 'Password changed successfully.';
      },
      error: (err) => {
        this.passwordSaving = false;
        this.passwordError = typeof err?.error === 'string' ? err.error : 'Unable to change password.';
      },
    });
  }
}
