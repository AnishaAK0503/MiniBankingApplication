import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KeycloakService } from '../../../core/services/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  readonly keycloak = inject(KeycloakService);
  readonly router = inject(Router);

  error = '';
  loading = false;

  ngOnInit(): void {
    if (this.keycloak.isAuthenticated()) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  loginWithKeycloak(): void {
    this.error = '';
    this.loading = true;
    this.keycloak
      .login()
      .then(() => this.router.navigateByUrl('/dashboard'))
      .catch(() => {
        this.error = 'Keycloak login could not be started.';
        this.loading = false;
      });
  }
}
