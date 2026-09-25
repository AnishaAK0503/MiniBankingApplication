import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KeycloakService } from './keycloak.service';

export type UserRole = 'maker' | 'checker' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = inject(KeycloakService);
  readonly currentUser$ = new BehaviorSubject<AppUser | null>(this.getCurrentUser());

  seedDemoUsers(): void {
    const current = this.getCurrentUser();
    if (current) this.currentUser$.next(current);
  }

  getCurrentUser(): AppUser | null {
    const keycloakUser = this.keycloak.getUserClaims();
    return keycloakUser
      ? { id: 0, ...keycloakUser, role: keycloakUser.role as UserRole, active: true }
      : null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  logout(): void {
    this.currentUser$.next(null);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return (
      parts
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2) || 'U'
    );
  }
}
