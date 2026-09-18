import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type UserRole = 'customer' | 'maker' | 'checker' | 'admin';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly storageKey = 'mini-banking-users';
  private readonly sessionKey = 'mini-banking-current-user';
  readonly currentUser$ = new BehaviorSubject<AppUser | null>(this.getCurrentUser());

  seedDemoUsers(): void {
    const current = this.getCurrentUser();
    if (current) this.currentUser$.next(current);
  }

  getUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) as AppUser[] : [];
    } catch {
      return [];
    }
  }

  getCurrentUser(): AppUser | null {
    try {
      const data = localStorage.getItem(this.sessionKey);
      return data ? (JSON.parse(data) as AppUser) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  login(email: string, password: string): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.apiUrl}/auth/login`, { email, password }).pipe(tap(user => this.setSession(user)));
  }

  register(payload: { name: string; email: string; password: string; role: UserRole }): Observable<AppUser> {
    return this.http.post<AppUser>(`${this.apiUrl}/auth/register`, payload).pipe(tap(user => this.setSession(user)));
  }

  getBackendUsers(): Observable<AppUser[]> { return this.http.get<AppUser[]>(`${this.apiUrl}/auth/users`); }

  private setSession(user: AppUser): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
    this.currentUser$.next(user);
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
    this.currentUser$.next(null);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(part => part.charAt(0).toUpperCase()).join('').slice(0, 2) || 'U';
  }
}
