# Banking Frontend

Angular frontend for the Banfico mini banking system. It integrates with the Spring Boot backend in `../banking-backend`.

## Run locally

Prerequisites: Node.js/npm, Java, PostgreSQL, and a running backend database.

```bash
npm install
npm start
```

Open `http://localhost:4200`. Start the backend separately with `mvnw.cmd spring-boot:run` from `../banking-backend`.

The development API URL is configured in `src/environments/environment.development.ts` as `http://localhost:8080/api`. Production uses `src/environments/environment.ts`; Angular's development build replaces the production environment automatically.

## Screens and API flow

- Dashboard loads customer, account, beneficiary, and transaction statistics.
- Customers supports list and create.
- Accounts supports list, create, and links to account transaction history.
- Transactions supports account lookup, history, and deposit/withdrawal creation.
- Beneficiaries supports list, add, and delete.

Forms use browser-side required/email/minimum-value validation. Backend validation and network failures are displayed in the relevant page.

## Verify

```bash
npm run build
npm test
```

The build output is written to `dist/`.
