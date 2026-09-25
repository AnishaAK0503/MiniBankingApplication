# Mini Banking Frontend

Angular frontend for the Mini Banking Operations application.

## Current Features

- Keycloak login and JWT-backed API access
- Role-aware navigation for Admin, Maker, and Checker
- Dashboard, customer, account, transaction, and beneficiary pages
- Maker-checker customer and account request history
- Pending approval workflow for customer and account requests
- Persistent notification drawer and notifications page
- Search, filters, pagination, CSV export, loading, empty, and error states
- Responsive dark banking operations design

Consent Management is deferred and is not included in the current frontend scope.

## Run

```powershell
npm install
npm start
```

Open `http://localhost:4200`.

The API URL is configured through the environment files under `src/environments/`.

## Build

```powershell
npm run build
```
