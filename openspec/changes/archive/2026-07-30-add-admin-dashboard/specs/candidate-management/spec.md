## ADDED Requirements

### Requirement: Candidate profile storage
The system SHALL store each candidate's information in a `candidates` table linked to their auth user, containing: personal info (full name, email address, mobile number, current location), professional info (total experience, current designation, current department, current salary), and application info (designation applied for, offered department, expected location, salary offered), plus a `currentStage` field.

#### Scenario: Candidate record created with all info groups
- **WHEN** an admin creates a candidate
- **THEN** the system stores personal, professional, and application info in one candidate record linked to the new auth user

### Requirement: Fixed 11-stage application pipeline
The system SHALL model the application journey as exactly these stages in order: Application Submitted, HR Screening, Technical Round 1, Technical Round 2, Salary Discussion, Appointment Letter, Background Verification Started, BGV Completed, Offer Letter Released, Onboarding, Joined. New candidates SHALL start at Application Submitted.

#### Scenario: New candidate starts at first stage
- **WHEN** an admin creates a candidate
- **THEN** the candidate's `currentStage` is Application Submitted

### Requirement: Stage updates with history
The system SHALL allow admins to move a candidate to any later stage in the pipeline (skipping forward allowed, backward moves disallowed) and SHALL record every stage change in a `statusEvents` table with the stage, timestamp, and an optional note.

#### Scenario: Admin advances a candidate
- **WHEN** an admin updates a candidate from HR Screening to Technical Round 2
- **THEN** the candidate's `currentStage` becomes Technical Round 2 and a status event is recorded with the new stage and timestamp

#### Scenario: Backward stage move rejected
- **WHEN** an admin attempts to move a candidate to an earlier stage than their current stage
- **THEN** the system rejects the update with an error

#### Scenario: History preserved on every change
- **WHEN** a candidate has been advanced multiple times
- **THEN** the system can return the full ordered list of stage events with timestamps for that candidate

### Requirement: Admin-only candidate management functions
All candidate create, update, list, and stage-change functions SHALL verify the caller has role `admin` and SHALL reject unauthenticated or non-admin callers.

#### Scenario: Non-admin cannot create candidates
- **WHEN** a caller without the admin role attempts to create a candidate
- **THEN** the system rejects the request with an authorization error

#### Scenario: Non-admin cannot list candidates
- **WHEN** a caller without the admin role attempts to list or read other candidates
- **THEN** the system rejects the request with an authorization error

### Requirement: Atomic candidate account and profile creation
Creating a candidate SHALL create the auth account (username, initial password, role `user`), the candidate profile record, and the initial status event as one operation, so no orphan accounts or profile-less users result.

#### Scenario: Duplicate username surfaces an error
- **WHEN** an admin creates a candidate with a username that already exists
- **THEN** the operation fails with a clear error and no partial records are left behind

### Requirement: Pipeline statistics
The system SHALL provide pipeline statistics for the admin dashboard: total candidates, interviews active (HR Screening through Salary Discussion), offers pending (Appointment Letter and Offer Letter Released), and BGV in progress (Background Verification Started through BGV Completed).

#### Scenario: Stats reflect current stages
- **WHEN** candidates exist at various stages
- **THEN** the stats query returns counts matching the stage-to-stat mapping

### Requirement: Paginated candidate listing
The system SHALL provide a cursor-paginated list of candidates for the directory table, ordered newest first.

#### Scenario: Admin pages through the directory
- **WHEN** an admin requests the next page of candidates
- **THEN** the system returns the next page using the provided cursor
