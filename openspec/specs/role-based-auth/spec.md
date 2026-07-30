# role-based-auth Specification

## Purpose

Defines the authentication and authorization model for the BGV portal: username-based login via better-auth, role-based access control with `admin` and `user` roles, admin-only account creation, and seeding of the initial admin account.

## Requirements

### Requirement: Username-based login
The system SHALL allow users to sign in with a username and password via the better-auth `username` plugin. Email-based sign-in SHALL NOT be the login path presented in the UI.

#### Scenario: Successful login with username
- **WHEN** a user submits valid username and password on the login page
- **THEN** the system authenticates the user and redirects them based on their role

#### Scenario: Failed login with invalid credentials
- **WHEN** a user submits an incorrect username or password
- **THEN** the system displays an error and does not create a session

### Requirement: Role-based access with admin and user roles
The system SHALL assign every account a role of either `admin` or `user` via the better-auth `admin` plugin, and SHALL enforce access based on that role.

#### Scenario: Admin redirected to admin dashboard
- **WHEN** a user with role `admin` logs in
- **THEN** the system redirects them to `/admin/dashboard`

#### Scenario: Candidate redirected to portal
- **WHEN** a user with role `user` logs in
- **THEN** the system redirects them to `/portal`

#### Scenario: Candidate blocked from admin routes
- **WHEN** an authenticated user with role `user` navigates to any `/admin/*` route
- **THEN** the system redirects them to `/portal`

#### Scenario: Admin blocked from candidate portal
- **WHEN** an authenticated user with role `admin` navigates to `/portal`
- **THEN** the system redirects them to `/admin/dashboard`

#### Scenario: Unauthenticated user blocked from protected routes
- **WHEN** an unauthenticated visitor navigates to any `/admin/*` or `/portal` route
- **THEN** the system redirects them to the login page

### Requirement: Admin-only account creation
The system SHALL allow only users with role `admin` to create new accounts (via `admin.createUser`), and SHALL NOT offer any public self-registration.

#### Scenario: Public sign-up is unavailable
- **WHEN** a visitor looks for a sign-up page or route
- **THEN** no public sign-up route or form exists in the application

#### Scenario: Admin creates a user account
- **WHEN** an admin creates a new account with a username, name, and initial password
- **THEN** the system creates the account with role `user` and the credentials are immediately usable for login

### Requirement: Tabbed login page
The login page SHALL present Admin and Candidate tabs as a presentational choice over a single shared login form and endpoint.

#### Scenario: Tabs share one authentication endpoint
- **WHEN** a user submits credentials from either the Admin or Candidate tab
- **THEN** the same sign-in endpoint is used and the post-login destination is determined solely by the account's role

### Requirement: Initial admin seeding
The system SHALL provide a seed mechanism that creates the first admin account (username `bgv-admin`, email `bgv-admin@kiewitcorporations.com`) so the portal is usable without public registration.

#### Scenario: Seeding the first admin
- **WHEN** the seed script is run in an environment with no admin account
- **THEN** the system creates an admin account with username `bgv-admin` that can log in and access `/admin/dashboard`

#### Scenario: Seed is idempotent
- **WHEN** the seed script is run and an admin account already exists
- **THEN** the system does not create a duplicate account or fail destructively
