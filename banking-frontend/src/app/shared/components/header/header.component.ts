import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { BankingApiService } from '../../../core/services/banking-api.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly keycloak = inject(KeycloakService);
  readonly api = inject(BankingApiService);
  user: ReturnType<AuthService['getCurrentUser']> = null;
  notifications: Notification[] = [];
  showNotifications = false;
  unreadCount = 0;

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.auth.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) this.loadNotifications();
    });
  }

  loadNotifications(): void {
    this.api.getNotifications().subscribe({ next: (items) => { this.notifications = items.slice(0, 5); } });
    this.api.getUnreadNotificationCount().subscribe({ next: (result) => this.unreadCount = result.count });
  }

  toggleNotifications(): void { this.showNotifications = !this.showNotifications; if (this.showNotifications) this.loadNotifications(); }

  closeNotifications(): void { this.showNotifications = false; }

  markRead(item: Notification): void {
    if (item.read) {
      this.showNotifications = false;
      return;
    }
    this.api.markNotificationRead(item.id).subscribe({
      next: () => {
        item.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.showNotifications = false;
      },
    });
  }

  get initials(): string {
    return this.auth.getInitials(this.user?.name ?? 'U');
  }

  async logout(): Promise<void> {
    this.auth.logout();
    if (this.keycloak.isAuthenticated()) {
      await this.keycloak.logout();
      return;
    }
    await this.router.navigateByUrl('/login');
  }
}
