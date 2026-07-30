## Purpose

Admin dashboard UI for viewing pipeline stats, browsing the candidate directory, adding candidates, and updating stages.

## Requirements

### Requirement: Admin overview layout
The admin overview page SHALL present a sidebar with navigation links, a top header with the page heading, and the page content area containing stats and the candidate directory.

#### Scenario: Admin opens the dashboard
- **WHEN** an admin navigates to `/admin/dashboard`
- **THEN** the page renders the sidebar, header, stats cards, and Enterprise directory section

### Requirement: Pipeline stats cards
The dashboard SHALL display stat cards for total candidates, interviews active, offers pending, and BGV in progress, updating in real time as candidate stages change.

#### Scenario: Stats update when a stage changes
- **WHEN** an admin advances a candidate into a BGV stage
- **THEN** the BGV in progress count increases without a page reload

### Requirement: Enterprise directory table
The dashboard SHALL include an "Enterprise directory" section with a paginated table listing all candidates, showing at minimum: name, designation applied for, current stage, and expected location.

#### Scenario: Admin browses candidates
- **WHEN** an admin views the directory
- **THEN** candidates are listed in a paginated table ordered newest first

### Requirement: Add candidate modal
The dashboard SHALL provide a button that opens a modal form for adding a candidate, validated with zod schemas, collecting: username, initial password, and all personal, professional, and application info fields.

#### Scenario: Admin adds a candidate successfully
- **WHEN** an admin completes the form with valid data and submits
- **THEN** the candidate is created, the modal closes, and the new candidate appears in the directory without a page reload

#### Scenario: Invalid form data is rejected client-side
- **WHEN** an admin submits the form with missing or invalid fields
- **THEN** validation errors are shown inline and no submission occurs

### Requirement: Stage update from the dashboard
The admin SHALL be able to update a candidate's stage from the dashboard, optionally attaching a note, choosing only among stages later than the candidate's current stage.

#### Scenario: Admin updates a stage with a note
- **WHEN** an admin selects a later stage and adds a note
- **THEN** the candidate's stage updates immediately and the note is stored with the status event
