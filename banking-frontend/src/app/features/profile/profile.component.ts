import { CommonModule } from '@angular/common';
import { afterNextRender, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BankingApiService } from '../../core/services/banking-api.service';
import { RolePermissionsService } from '../../core/services/role-permissions.service';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly api = inject(BankingApiService);
  readonly permissions = inject(RolePermissionsService);
  customer: Customer | null = null;
  profileError = '';

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
}
