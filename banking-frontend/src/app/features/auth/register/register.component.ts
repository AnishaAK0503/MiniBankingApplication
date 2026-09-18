import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, UserRole } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

  form = {
    name: '',
    email: '',
    password: '',
    role: 'customer' as UserRole
  };
  error = '';
  loading = false;

  register(): void {
    this.error = '';
    this.loading = true;

    this.auth.register(this.form).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/dashboard'); },
      error: err => { this.error = typeof err?.error === 'string' ? err.error : 'Registration failed.'; this.loading = false; }
    });
  }
}
