# Mini Banking Application

Mini Banking is a full-stack banking operations application built with Angular, Spring Boot, PostgreSQL, Keycloak, and Nginx. The project includes the core banking workflows as well as the consent-management capstone flow for the final week.

## Current Scope

- Customer management
- Bank account management
- Transaction history and deposits/withdrawals
- Beneficiary management
- Maker-checker customer and account request workflows
- Consent request creation, approval/rejection, revocation, and expiry checks
- Transfer and transaction approval workflows
- Database-backed audit logging and notifications
- Protected backend APIs with JWT validation
- Role-based authorization for CUSTOMER, MAKER, CHECKER, and ADMIN
- PostgreSQL persistence with JPA/Hibernate
- Responsive dark banking operations UI
- Pagination, search/filter controls, CSV export, loading, empty, and error states
- Nginx gateway and Docker Compose orchestration

## Roles

- ADMIN: system administration, visibility into all workflows, approval queues, user administration, and deletion controls
- MAKER: creates account and customer requests, manages beneficiaries, and initiates banking actions that require a checker review
- CHECKER: reviews and approves/rejects requests, including customer, account, transfer, transaction, and consent requests
- CUSTOMER: signs in through Keycloak, accesses their own profile and accounts, creates beneficiaries, and creates consent requests for protected actions

Customers can sign in through Keycloak and access only their own banking profile and accounts. Staff roles retain their existing operations and approval workflows.

## Weekly Progress

- [Work_week01.md](Work_week01.md): project setup, Git, Spring Boot, PostgreSQL, REST basics
- [Work_week02.md](Work_week02.md): banking CRUD APIs, JPA entities, DTOs, validation, and exception handling
- [Work_week03.md](Work_week03.md): Angular frontend integration, listing screens, pagination, CSV export, and maker-checker foundations
- [Work_week04.md](Work_week04.md): Keycloak, JWT/OAuth2, role protection, approval workflows, notifications, and UI improvements
- [Work_week05.md](Work_week05.md): Docker Compose, Nginx gateway, consent flow, release hardening, and deployment verification
- [Work_extra.md](Work_extra.md): additional usability, audit, beneficiary, dashboard, export, and deployment features

## Current Delivery Status

The main requested application functionality is implemented and documented:

- Keycloak login with JWT validation and role-based access
- CUSTOMER, MAKER, CHECKER, and ADMIN workflows
- Customer, account, transaction, transfer, and beneficiary management
- Maker-checker request creation, approval, rejection, and mandatory rejection reasons
- Consent creation, listing, approval, rejection, revocation, and payment execution
- Internal and external beneficiary support with validation
- Database-backed notifications and audit events
- CSV exports that respect active list filters
- Responsive dashboard and role-specific direct-access navigation
- Docker Compose deployment behind an Nginx gateway

The repository also contains the detailed weekly and extra-work summaries linked above.

## Project Structure

```text
MiniBankingApp/
├── banking-backend/   Spring Boot REST API
├── banking-frontend/  Angular application
├── nginx/             Nginx API gateway configuration
├── keycloak/          Development realm import
├── docker-compose.yml Full local stack
├── Work_week01.md
├── Work_week02.md
├── Work_week03.md
├── Work_week04.md
├── Work_week05.md
├── Work_extra.md
└── README.md
```

## Run Locally

### Backend

```powershell
cd banking-backend
.\mvnw.cmd spring-boot:run
```

The backend uses PostgreSQL and listens on `http://localhost:8080`.

### Frontend

```powershell
cd banking-frontend
npm install
npm start
```

Open `http://localhost:4200`.

## Configuration

Backend configuration is in [banking-backend/src/main/resources/application.properties](banking-backend/src/main/resources/application.properties).

The current local setup expects:

- PostgreSQL database: `bankingdb`
- Keycloak issuer: `http://localhost:8081/realms/mini-banking`
- Frontend API URL: `http://localhost:8080/api`

The database migration script is [migration.sql](banking-backend/src/main/resources/db/migration.sql). It creates the request and notification tables without Hibernate timestamp auto-conversion.

## Verification

```powershell
cd banking-frontend
npm run build
```

```powershell
cd banking-backend
<<<<<<< HEAD
.\mvnw.cmd testred until the next project phase. They should be reintroduced as a separate feature without changing the completed Weeks 1-4 banking and authentication work.
=======
.\mvnw.cmd test
```

The Angular production build and Docker frontend build are the primary frontend checks. Backend tests require the configured Keycloak issuer to be reachable when security integration tests are enabled.

## Week 5 and Week 6: Docker, Gateway, and Consent Demo

The Compose setup runs PostgreSQL, Keycloak, the Spring Boot API, the Angular SSR frontend, and Nginx. Nginx is the only service published to the host; the backend, frontend, database, and Keycloak communicate over the private Compose network.

### Start the stack

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps
```

The checked-in defaults in `.env.example` are for local development only. Change them in `.env` if needed. Do not use these credentials in a deployed environment or commit `.env`.

### Gateway URLs

| URL | Routed to |
|---|---|
| `http://localhost:8080/` | Angular frontend |
| `http://localhost:8080/api/...` | Spring Boot API |
| `http://localhost:8080/health` | Backend health check |
| `http://localhost:8080/auth/` | Keycloak |
| `http://localhost:8080/auth/admin/` | Keycloak Admin Console |

For example, `GET http://localhost:8080/api/customers` reaches the backend through Nginx. Protected API calls need a Keycloak bearer token; an unauthenticated request should return `401`. `GET http://localhost:8080/api/info` is public and can be used for an API routing smoke test.

### First Keycloak login and demo role setup

The `mini-banking` realm and public `mini-banking-app` client are imported from [keycloak/realm-export.json](keycloak/realm-export.json) on the first Keycloak startup. The realm contains `CUSTOMER`, `MAKER`, `CHECKER`, and `ADMIN` roles, but no application users are pre-created.

1. Sign in to the Admin Console at `http://localhost:8080/auth/admin/` using `KEYCLOAK_ADMIN_USERNAME` and `KEYCLOAK_ADMIN_PASSWORD` from `.env`.
2. Select the `mini-banking` realm and create four application users with the following role assignments:
   - `customer.demo` with role `CUSTOMER`
   - `maker.demo` with role `MAKER`
   - `checker.demo` with role `CHECKER`
   - `admin.demo` with role `ADMIN`
3. Set a development password for each user, e.g. `Password@123` for all demo users in the local environment only.
4. Create a matching customer record in the banking app for `customer.demo` using the same email address used in Keycloak. The backend links Keycloak users to customers by email.
5. Open `http://localhost:8080/` and sign in through the frontend using a demo user.

Keycloak keeps its realm data in the `keycloak-data` volume. Realm import is for first initialization; editing the import JSON does not overwrite an already initialized realm.

### Role-specific demo data

Use the following demo flow for the final capstone:

- CUSTOMER demo user
  - Login with the Keycloak user that has the `CUSTOMER` role
  - Create or select their customer profile
  - Add a beneficiary
  - Request a consent for a payment or account-access action
  - Revoke an approved consent when needed

- MAKER demo user
  - Logs in with the `MAKER` role
  - Creates customer or account requests
  - Creates transfer or transaction requests that require approval

- CHECKER demo user
  - Logs in with the `CHECKER` role
  - Reviews pending approvals
  - Approves or rejects customer requests, account requests, transfers, transaction requests, and consent requests

- ADMIN demo user
  - Logs in with the `ADMIN` role
  - Reviews all pending requests
  - Approves or rejects workflows and validates all role-based access

### Consent demo flow

1. Login as the customer user.
2. Create a beneficiary.
3. Create a consent request for `PAYMENT` or `ACCOUNT_ACCESS` from the customer account.
4. Login as `checker.demo` and approve the consent request.
5. Retry the protected action (for example, a transfer that requires consent).
6. Confirm that the action succeeds only after the consent is approved.
7. Revoke or reject the consent to confirm the protected operation is denied.

This sequence should be used in the final Week 6 live demo.

### Request flow

```text
Browser -> Nginx :8080 -> Frontend SSR :4000
					   -> Backend API :8080
					   -> Keycloak :8080 under /auth
Backend -> PostgreSQL :5432
```

The frontend uses same-origin `/api` and `/auth` URLs in its production build. Nginx forwards the host, client IP, and original protocol headers. The backend validates JWT issuer values against the public gateway URL and obtains Keycloak signing keys over the private Compose network.

### Logs and shutdown

```powershell
docker compose logs -f gateway
docker compose logs -f backend
docker compose logs -f keycloak
docker compose logs -f database
docker compose down
```

Nginx access logs are written to stdout and error logs to stderr, so `docker compose logs gateway` shows both. `docker compose down` stops containers but preserves database and Keycloak volumes. `docker compose down -v` permanently deletes that development data; only use it when you intentionally want a fresh database and realm.

The backend migration creates the core banking tables before the existing request/notification tables when using a fresh PostgreSQL volume. Existing volumes are preserved by Compose.

### Updating and pushing the repository

The repository remote is:

```text
https://github.com/AnishaAK0503/MiniBankingApplication.git
```

When the remote already contains commits and the local worktree contains changes, commit local work first, rebase it on the latest `main`, and then push:

```powershell
cd D:\MiniBankingApp
git status -sb
git add -A
git commit -m "docs: update project documentation

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git pull --rebase origin main
git push origin main
```

If the rebase reports conflicts, resolve the marked files, then run:

```powershell
git add -A
git rebase --continue
git push origin main
```

Do not use `git push --force` for the shared `main` branch. Do not commit `.env`; use `.env.example` as the configuration template.

### Troubleshooting

- If port `8080` is busy, set another `GATEWAY_PORT` in `.env`; Keycloak's advertised URL uses that same value.
- Wait for `docker compose ps` to show the backend, frontend, and gateway as healthy before opening the app.
- For `502 Bad Gateway`, inspect `docker compose logs backend frontend gateway`.
- If login redirects to a different host or port, verify `GATEWAY_PORT`, `KC_HOSTNAME`, and the frontend client redirect URI in the imported realm.
- The Keycloak Admin Console is available through `/auth/admin/`; Keycloak itself is not published on a separate host port.

## Final Capstone Checklist

The completed project includes the following end-to-end demo requirements:

- Login using Keycloak
- Create customer
- Create account
- View account details
- View transaction history
- Add beneficiary
- Create consent request
- Approve/reject consent
- Protected backend APIs
- Role-based access
- Nginx gateway
- PostgreSQL persistence
- Docker Compose setup
- README documentation

The final review should use the role-specific demo data above and should validate the consent lifecycle through both the UI and the backend API.
>>>>>>> 71ea372 (Completed week 5 and Some extra features)
