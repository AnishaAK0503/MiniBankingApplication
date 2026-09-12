# Mini Banking Application

A full-stack banking management application built with Angular and Spring Boot. The application allows users to manage customers, bank accounts, transactions, and beneficiaries through a simple dashboard.

## Project Overview

This project is divided into two parts:

- `banking-frontend`: Angular web application
- `banking-backend`: Spring Boot REST API connected to PostgreSQL

The frontend communicates with the backend through REST APIs.

## Implemented Features

### Dashboard

- Displays total number of customers
- Displays total number of accounts
- Displays total number of transactions
- Displays total number of beneficiaries
- Displays total account balance
- Provides quick navigation to each banking feature

### Customer Management

- View all customers
- Create a new customer
- Validate customer name, email, and phone number
- Display backend and network errors

### Account Management

- View all bank accounts
- Create a new account
- Select the account type:
  - Checking
  - Savings
- Set the opening balance
- Assign an account to a customer
- View account transaction history

### Transaction Management

- Search for an account using its ID
- View transaction history
- Create deposits
- Create withdrawals
- Add transaction descriptions
- Display transaction date, type, description, and amount
- Backend validation for insufficient balance

### Beneficiary Management

- View all beneficiaries
- Add a beneficiary
- Store beneficiary name, account number, bank name, and customer ID
- Delete a beneficiary

## Technologies Used

### Frontend

- Angular
- TypeScript
- HTML
- CSS
- RxJS
- Angular Forms
- Angular Router

### Backend

- Java 17
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Hibernate
- PostgreSQL
- Lombok
- Maven

## Project Structure

```text
MiniBankingApp/
├── banking-backend/
│   ├── src/main/java/com/banfico/banking/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   └── exception/
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── banking-frontend/
│   ├── src/app/
│   │   ├── core/
│   │   ├── features/
│   │   └── shared/
│   ├── src/environments/
│   ├── package.json
│   └── angular.json
│
└── README.md
