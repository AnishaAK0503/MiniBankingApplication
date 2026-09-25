# Mini Banking Application

Mini Banking is a full-stack banking operations application built with Angular, Spring Boot, PostgreSQL, and Keycloak. The current project scope covers the first four weeks of the GCT training program.

## Current Scope

- Customer management
- Bank account management
- Transaction history and deposits/withdrawals
- Beneficiary management
- Maker-checker customer and account request workflows
- Persistent notifications for Admin, Maker, and Checker
- Keycloak authentication with JWT validation
- Role-based authorization for ADMIN, MAKER, and CHECKER
- PostgreSQL persistence with JPA/Hibernate
- Responsive dark banking operations UI
- Pagination, search/filter controls, CSV export, loading, empty, and error states

Consent Management is intentionally deferred for a later phase and is not part of the current application scope.

## Roles

- ADMIN: direct customer/account creation, administration, workflow visibility, and controlled deletion with a mandatory reason
- MAKER: creates customer/account requests, manages beneficiaries, views transactions, and sees request history
- CHECKER: reviews and approves/rejects customer/account requests

A Customer is a PostgreSQL banking record. Customers do not log in and there is no CUSTOMER Keycloak role.

## Weekly Progress

- [Work_week01.md](Work_week01.md): project setup, Git, Spring Boot, PostgreSQL, REST basics
- [Work_week02.md](Work_week02.md): banking CRUD APIs, JPA entities, DTOs, validation, and exception handling
- [Work_week03.md](Work_week03.md): Angular frontend integration, listing screens, pagination, CSV export, and maker-checker foundations
- [Work_week04.md](Work_week04.md): Keycloak, JWT/OAuth2, role protection, approval workflows, notifications, and UI improvements

## Project Structure

```text
MiniBankingApp/
├── banking-backend/   Spring Boot REST API
├── banking-frontend/  Angular application
├── Work_week01.md
├── Work_week02.md
├── Work_week03.md
├── Work_week04.md
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
.\mvnw.cmd test
```

## Deferred Work

Consent creation, consent approval/rejection, and consent-based transaction guarding are deferred until the next project phase. They should be reintroduced as a separate feature without changing the completed Weeks 1-4 banking and authentication work.
