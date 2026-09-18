import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();
  const allowedRoles = route.data['roles'] as UserRole[] | undefined;

  if (user && (!allowedRoles || allowedRoles.includes(user.role))) return true;
  return router.createUrlTree(['/dashboard']);
};
