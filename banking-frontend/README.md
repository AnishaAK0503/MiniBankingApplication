# Mini Banking App

This project is a mini banking management system built with Angular on the frontend and Spring Boot on the backend. It keeps the original banking flows for customers, accounts, transactions, and beneficiaries while adding a more polished user experience, login flow, and role-based navigation.

## What is implemented

- Customer management screen
- Account management screen
- Transaction screen for account history and new deposits/withdrawals
- Beneficiary management screen
- Dashboard with overview cards and summary metrics
- Login and registration pages
- Role-aware user session using demo local storage auth
- UI permissions for Customer, Maker, Checker, and Admin roles
- Maker-Checker account request workflow
- Pending approval flow for account, transaction, and beneficiary requests
- Pagination and CSV export for application listings
- Responsive horizontal tables with improved alignment and overflow handling
- Cleaner sidebar/header layout with better styling

## Week 3 update

This week I continued developing the Mini Banking Application and improved the Angular frontend and Spring Boot backend integration.

- Learned more about role-based access control for Customer, Maker, Checker, and Admin users
- Implemented the Maker-Checker approval workflow for account requests
- Added request status handling for `PENDING`, `PENDING_APPROVAL`, `APPROVED`, and `REJECTED`
- Ensured that an account is created only after Checker approval
- Added pending approval handling for transaction and beneficiary requests
- Added pagination and CSV export to customer, account, transaction, beneficiary, request, user, and audit-log listings
- Improved loading states, error handling, refresh actions, and responsive table layouts
- Fixed table alignment, column sizing, text overflow, and unnecessary page-level scrolling
- Tested the main role-based flows and verified communication between the Angular frontend and Spring Boot backend

## Project structure

- Frontend: Angular app in `banking-frontend`
- Backend: Spring Boot app in `banking-backend`

The core banking logic remains intact in the existing components and services, and the newer login/register flow is layered on top without removing the original banking features.

## Frontend features

- Dashboard shows totals for customers, accounts, beneficiaries, and transactions
- Account pages connect to transaction history views
- Customers, accounts, beneficiaries, and transactions retain their original functionality
- User profile page shows current user information and role
- Navigation shell includes header, sidebar, and logout functionality

## Authentication flow

The app includes a simple role-based demo authentication flow for:

- Customer
- Maker
- Admin

Demo users are seeded automatically in local storage so the app can run without a backend auth service.

The current demo role behavior is handled through the UI and local storage authentication. Navigation and available actions are shown according to the selected role. Keycloak, JWT authentication, and backend API authorization are planned for the next phase.

## Commands to run

### 1) Backend

From the backend folder:

```powershell
cd banking-backend
./mvnw.cmd spring-boot:run
```

If you are using Git Bash or another Unix-like shell, use:

```bash
cd banking-backend
./mvnw spring-boot:run
```

### 2) Frontend

From the frontend folder:

```powershell
cd banking-frontend
npm install
npm start
```

Then open:

```text
http://localhost:4200
```

## Environment notes

- Backend API is expected at `http://localhost:8080/api`
- PostgreSQL connection details are configured in the backend application properties
- The app is designed for local development and demo usage

## Build verification

```bash
cd banking-frontend
npm run build
```

```bash
cd banking-backend
./mvnw test
```

## Notes

This is a mini banking app meant for learning, demo, and development purposes. The project combines business workflow screens with a modern UI shell while preserving the original customer/account/transaction/beneficiary logic.
