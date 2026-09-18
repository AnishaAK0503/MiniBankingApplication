import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  readonly auth = inject(AuthService);

  get user() {
    return this.auth.getCurrentUser();
  }

  get initials(): string {
    return this.auth.getInitials(this.user?.name ?? 'User');
  }
}
