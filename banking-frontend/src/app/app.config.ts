import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { keycloakInterceptor } from './core/interceptors/keycloak.interceptor';
import { KeycloakService } from './core/services/keycloak.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([keycloakInterceptor])),
    provideAppInitializer(() => inject(KeycloakService).init()),
  ],
};
