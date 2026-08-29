# Hospital Stay Tracker

## User Story
As a user, I want to track hospital stays with a dedicated option and a calendar to input day-by-day info and a check for discharge.

## Requirements

### Calendar View
- Display a monthly calendar showing hospital stay days
- Each day should indicate whether the patient was admitted, discharged, or present
- Allow clicking on a day to add/edit notes

### Day-by-Day Entry
- Input fields for each day: vitals, medications, treatments, notes
- Auto-save entries when switching days
- Support recurring daily summaries

### Discharge Check
- Dedicated discharge button/flow
- On discharge: capture discharge date, reason, follow-up instructions
- Mark the stay as complete and lock further edits

### Data Model
- Patient Name: string, required
- YYYY-MM-DD: date, required
- YYYY-MM-DD: date, optional
- : array of {date, content}
- : enum [admitted, discharged, pending]

## Acceptance Criteria
- [ ] Calendar renders with current month highlighted
- [ ] User can add notes for any day
- [ ] Discharge flow captures all required fields
- [ ] Discharged stays are visually distinguished
- [ ] Data persists across sessions