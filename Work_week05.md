# Work Week 05 - Docker, Nginx Gateway, Consent Flow, and Release Hardening

## Week Goal

Prepare the Mini Banking Application for a gateway-based local deployment, verify the end-to-end stack, and complete the release-hardening work needed for the final banking demo.

## Completed Work

- Added and verified Docker Compose orchestration for the application stack.
- Ran the Spring Boot backend, Angular frontend, PostgreSQL, Keycloak, and Nginx gateway as separate services.
- Routed browser traffic through Nginx instead of exposing the backend and frontend directly.
- Confirmed the gateway routes:
  - `/` to the Angular frontend
  - `/api` to the Spring Boot backend
  - `/auth` to Keycloak
- Added gateway response headers to reduce stale browser caching during frontend refreshes.
- Verified the frontend bundle served through the gateway after deployment.
- Confirmed the backend and frontend containers report healthy status after rebuilds.
- Preserved the existing authentication, authorization, and role-based access rules while introducing the gateway layer.

## Keycloak and Login Flow

- Verified the Keycloak realm import and client configuration used by the app.
- Confirmed the application uses JWT-based login through Keycloak.
- Rechecked role handling for:
  - CUSTOMER
  - MAKER
  - CHECKER
  - ADMIN
- Confirmed the app continues to use email-based identity matching for customer records.

## Consent Flow Completed

- Added consent request creation from the customer side.
- Added consent request listing for Maker, Checker, Admin, and Customer views where allowed.
- Added consent approval and rejection handling.
- Added consent revocation for customers and admins.
- Added payment amount support for payment consents.
- Added approval-time execution for approved payment consents.
- Ensured only `PAYMENT` consent requests trigger money movement.
- Kept `ACCOUNT_ACCESS` and `DATA_SHARE` as authorization-style consents without moving funds.
- Added inline rejection-reason input on the consent page instead of a browser prompt.
- Fixed consent error messaging so structured backend errors display as readable text.

## UI and Frontend Hardening

- Improved the Angular dashboard layout and role-based front page presentation.
- Added compact summary cards and responsive chart panels.
- Added role-specific direct-access cards on dashboard pages.
- Improved dropdown styling and selector consistency.
- Kept the frontend responsive across desktop and mobile breakpoints.
- Preserved current business logic and API contracts while improving the presentation layer.

## Verification

- Angular production build passes.
- Frontend Docker image rebuilds successfully.
- Gateway serves the latest frontend bundle.
- Consent requests are visible in the role-based consent screens.
- The application stack remains operational behind Nginx.

