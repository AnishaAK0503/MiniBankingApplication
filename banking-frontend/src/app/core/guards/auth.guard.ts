import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { KeycloakService } from '../services/keycloak.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const keycloak = inject(KeycloakService);
  return auth.isLoggedIn() || keycloak.isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/login']);
};
