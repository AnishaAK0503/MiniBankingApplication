import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

  form = { email: 'anisha@bank.com', password: '123456' };
  error = '';
  loading = false;

  login(): void {
    this.error = '';
    this.loading = true;

    this.auth.login(this.form.email, this.form.password).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/dashboard'); },
      error: err => { this.error = typeof err?.error === 'string' ? err.error : 'Invalid email or password.'; this.loading = false; }
    });
  }
}
