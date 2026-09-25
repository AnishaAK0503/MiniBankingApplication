# Work Week 02 - Banking CRUD API

## Training Goal

Build a simple banking domain with REST APIs, JPA persistence, validation, and error handling.

## Completed Work

- Implemented the Customer domain and customer REST APIs.
- Implemented the Bank Account domain and customer-to-account relationship.
- Implemented transaction history and account transaction APIs.
- Implemented Beneficiary management and account/customer linking.
- Added DTOs for request and response payloads.
- Added service and repository layers using Spring Data JPA.
- Added request validation for customer, account, transaction, and beneficiary operations.
- Added PostgreSQL table persistence through Hibernate/JPA.
- Added centralized REST exception handling for validation, missing resources, balance errors, and business errors.
- Tested the API request/response flow with local REST requests.

## Main API Areas

- `/api/customers`
- `/api/accounts`
- `/api/accounts/{accountId}/transactions`
- `/api/beneficiaries`

## Outcome

The project had a working banking CRUD backend with persisted customers, accounts, transactions, and beneficiaries.
