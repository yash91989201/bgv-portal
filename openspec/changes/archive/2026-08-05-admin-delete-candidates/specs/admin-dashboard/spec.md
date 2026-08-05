## ADDED Requirements

### Requirement: Directory row selection for bulk actions
The Enterprise directory table SHALL allow the admin to select individual candidates on the current page via checkboxes, and to select or clear all rows on the current page via a header checkbox. Selection SHALL be limited to the current page and SHALL clear when the page or filters change.

#### Scenario: Admin selects multiple rows on the current page
- **WHEN** an admin checks several candidate rows on the current page
- **THEN** those rows are marked selected and a bulk action bar shows the selected count

#### Scenario: Select-all applies only to the current page
- **WHEN** an admin uses the header select-all checkbox
- **THEN** only candidates visible on the current page are selected

#### Scenario: Selection clears on page or filter change
- **WHEN** the admin changes page, name, position, or stage filters while rows are selected
- **THEN** the selection is cleared

### Requirement: Single candidate delete from the directory
The directory Actions column SHALL include a delete control alongside edit. Choosing delete SHALL require confirmation in an AlertDialog that names the candidate and warns that the profile, stage history, and login are permanently removed.

#### Scenario: Admin deletes one candidate from a row
- **WHEN** an admin clicks the row delete control and confirms in the AlertDialog
- **THEN** that candidate is permanently deleted and disappears from the directory without a page reload

#### Scenario: Admin cancels single delete
- **WHEN** an admin opens the delete confirmation and cancels
- **THEN** no candidate is deleted and the dialog closes

### Requirement: Bulk candidate delete from the directory
When one or more rows are selected, the directory SHALL show a bulk action bar with a Delete selected control. Confirming bulk delete SHALL require an AlertDialog that states how many candidates will be permanently removed.

#### Scenario: Admin bulk-deletes selected candidates
- **WHEN** an admin selects one or more current-page candidates, clicks Delete selected, and confirms
- **THEN** those candidates are permanently deleted, the selection clears, and the directory and stats update without a page reload

#### Scenario: Admin cancels bulk delete
- **WHEN** an admin opens the bulk delete confirmation and cancels
- **THEN** no candidates are deleted and the selection remains

### Requirement: Delete feedback and error handling
The directory SHALL show success or error feedback after a delete attempt (for example via toast). On failure, selected rows that were not deleted SHALL remain available for retry where applicable.

#### Scenario: Delete failure surfaces an error
- **WHEN** a delete mutation fails
- **THEN** the admin sees an error message and the directory does not silently claim success
