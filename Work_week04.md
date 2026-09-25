# Work Week 04 - Keycloak, JWT, Authorization, and Workflow Improvements

## Training Goal

Understand authentication versus authorization and protect backend APIs using Keycloak, JWT, OAuth2 concepts, and role-based access.

## Authentication and Authorization Completed

- Integrated Keycloak authentication into the Angular application.
- Added JWT bearer token handling for backend API calls.
- Added Spring Security OAuth2 resource-server configuration.
- Added Keycloak realm-role extraction into Spring authorities.
- Added backend role restrictions for ADMIN, MAKER, and CHECKER.
- Added Angular authentication and role guards for navigation and user experience.
- Preserved backend authorization as the final security boundary.
- Kept unauthenticated and unauthorized operations separated as 401/403 cases.
- Removed customer login and registration concepts; Customer remains a banking domain record.

## Maker-Checker Workflow Completed

- Added Customer Creation Requests.
- Added Account Creation Requests using the existing account request infrastructure.
- Makers create requests instead of directly creating final records.
- Checkers can approve or reject pending requests.
- Customers and accounts are created only after approval.
- Rejection reasons are mandatory and stored with reviewer details.
- Added requester, reviewer, timestamps, status, and created-record references.
- Added transactional approval behavior and database locking to prevent duplicate approvals.
- Added Admin direct creation paths without unnecessary Checker approval.

## Persistent Notifications Completed

- Added PostgreSQL-backed notifications for Admin, Maker, and Checker.
- Added unread count, read state, mark-read, and mark-all-read APIs.
- Added notification drawer, bell icon, unread badge, and Notifications page.
- Added workflow notifications for new requests, approvals, rejections, and deletions.
- Notification ownership is derived from the authenticated JWT identity.

## Frontend and UX Improvements Completed

- Redesigned the Angular application with a dark navy banking operations theme.
- Added centralized design tokens and consistent shared styles.
- Improved the navigation shell, dashboard, listing pages, forms, tables, status badges, modals, and toast messages.
- Added account search, account-type, and account-status filters.
- Added modal-based customer, account, and beneficiary creation flows.
- Added reason-required Admin deletion flows for customers and accounts.
- Added Maker/Checker notifications for Admin deletions.
- Added a banking favicon and updated application branding.
- Added responsive desktop, tablet, and mobile layouts.

## Current Scope Decision

Consent Management is deferred for now. Consent controllers, services, entities, APIs, frontend screens, and approval items were removed from the Week 1-4 scope. It can be reintroduced as a future project phase.

## Verification

- Backend Maven tests pass.
- Angular production build passes.
- Spring Boot connects to PostgreSQL.
- Existing customer, account, transaction, beneficiary, Keycloak, and role-protection flows remain in the project.
