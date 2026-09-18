import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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
  user: ReturnType<AuthService['getCurrentUser']> = null;

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.auth.currentUser$.subscribe((user) => {
      this.user = user;
    });
  }

  get initials(): string {
    return this.auth.getInitials(this.user?.name ?? 'U');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
