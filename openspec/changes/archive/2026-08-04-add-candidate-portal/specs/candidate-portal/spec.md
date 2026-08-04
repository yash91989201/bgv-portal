## ADDED Requirements

### Requirement: Candidate portal page
The system SHALL provide a candidate portal page at `/portal` with a header containing a sign-out button, a greeting card showing the candidate's name and current application stage, and tabbed content below.

#### Scenario: Candidate opens the portal
- **WHEN** a candidate with role `user` navigates to `/portal`
- **THEN** the page shows a header with sign-out, a greeting card with their name and current stage, and tabs for Application Journey and My Profile

#### Scenario: Sign out
- **WHEN** a candidate clicks the sign-out button
- **THEN** the session ends and the user is redirected to the login page

### Requirement: Application journey timeline
The Application Journey tab SHALL display all 11 pipeline stages as a timeline, marking stages the candidate has completed (with the timestamp of each completion), highlighting the current stage, and showing remaining stages as upcoming.

#### Scenario: Candidate views their journey
- **WHEN** a candidate opens the Application Journey tab
- **THEN** completed stages show their timestamps, the current stage is highlighted, and future stages appear as upcoming

#### Scenario: Journey reflects skipped stages
- **WHEN** an admin has advanced a candidate past one or more stages
- **THEN** the timeline still shows the full 11-stage sequence with the actual stages reached marked complete

### Requirement: Real-time stage updates
The portal SHALL reflect stage changes made by an admin in real time without requiring the candidate to reload the page.

#### Scenario: Admin advances a logged-in candidate
- **WHEN** an admin updates a candidate's stage while the candidate is viewing the portal
- **THEN** the greeting card and timeline update automatically to the new stage

### Requirement: Read-only profile view
The My Profile tab SHALL display the candidate's personal info (full name, email address, mobile number, current location), professional info (total experience, current designation, current department, current salary), and application info (designation applied for, offered department, expected location, salary offered) in read-only form.

#### Scenario: Candidate views their profile
- **WHEN** a candidate opens the My Profile tab
- **THEN** all their stored information is displayed with no editing controls

### Requirement: Own-record data access
Candidate-facing queries SHALL return only the calling candidate's own record and status history; a candidate SHALL NOT be able to read another candidate's data by any parameter manipulation.

#### Scenario: Candidate cannot access another candidate's record
- **WHEN** a candidate attempts to query data for a different candidate id
- **THEN** the system rejects the request or returns only their own record
