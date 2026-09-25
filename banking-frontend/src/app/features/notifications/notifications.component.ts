import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankingApiService } from '../../core/services/banking-api.service';
import { Notification } from '../../core/models/notification.model';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent {
  private readonly api = inject(BankingApiService);
  private readonly toast = inject(ToastService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  notifications: Notification[] = [];
  filter: 'all' | 'unread' | 'read' = 'all';
  loading = true;

  constructor() { this.load(); }

  get visible(): Notification[] {
    return this.notifications.filter((item) => this.filter === 'all' || (this.filter === 'unread' ? !item.read : item.read));
  }

  load(): void {
    this.api.getNotifications().subscribe({
      next: (items) => { this.notifications = items; this.loading = false; this.changeDetector.detectChanges(); },
      error: () => { this.loading = false; this.toast.show('Unable to load notifications.', 'error'); },
    });
  }

  markRead(item: Notification): void {
    if (item.read) return;
    this.api.markNotificationRead(item.id).subscribe({
      next: (updated) => {
        item.read = updated.read;
        this.changeDetector.detectChanges();
      },
      error: () => this.toast.show('Unable to mark notification as read.', 'error'),
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach((item) => item.read = true);
        this.changeDetector.detectChanges();
      },
      error: () => this.toast.show('Unable to mark notifications as read.', 'error'),
    });
  }
}
