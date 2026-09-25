import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInstance } from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private readonly client: KeycloakInstance = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });
  private initialized = false;
  private authenticated = false;

  async login(): Promise<void> {
    await this.init();
    await this.client.login();
  }

  async register(): Promise<void> {
    await this.init();
    await this.client.register();
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.authenticated = await this.client.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
    } catch {
      this.authenticated = false;
    } finally {
      this.initialized = true;
    }
  }

  async logout(): Promise<void> {
    if (!this.initialized) return;
    await this.client.logout({ redirectUri: window.location.origin });
  }

  isAuthenticated(): boolean {
    return this.authenticated && !!this.client.token;
  }

  hasAnyRole(roles: string[]): boolean {
    const keycloakRoles = this.client.realmAccess?.roles ?? [];
    return roles.some((role) =>
      keycloakRoles.some((keycloakRole) => keycloakRole.toLowerCase() === role.toLowerCase()),
    );
  }

  getUserClaims(): { name: string; email: string; role: string } | null {
    if (!this.isAuthenticated()) return null;
    const claims = this.client.tokenParsed ?? {};
    const role = ['admin', 'maker', 'checker'].find((candidate) => this.hasAnyRole([candidate]));
    if (!role) return null;
    return {
      name: String(claims['name'] ?? claims['preferred_username'] ?? 'Keycloak user'),
      email: String(claims['email'] ?? ''),
      role,
    };
  }

  async getToken(): Promise<string | undefined> {
    if (!this.isAuthenticated()) return undefined;
    await this.client.updateToken(30);
    return this.client.token;
  }

}
