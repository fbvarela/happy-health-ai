# Emergency Button Feature

## User Story
As a user, I want to have a red button for emergencies on the app so that I can quickly trigger an emergency call.

## Requirements

### ER-1: Emergency Button
- A prominent red emergency button must be visible on the main app screen.
- The button must be easily accessible and distinguishable from other UI elements.

### ER-2: Emergency Call
- When the emergency button is pressed, the app must initiate a call to **112** (emergency number).
- The call should be triggered using the device's native dialer.

### ER-3: Emergency Form Modal
- Upon pressing the emergency button, a modal form must appear before placing the call.
- The modal must include:
  - A **list of common emergencies** (selectable):
    - Fall
    - Faint
    - Choking
    - Heart attack
    - Acute pain
    - Other (custom)
  - A **free-text field** for additional details
  - A **"Solved" checkbox** to mark the emergency as resolved
- The user can submit the form to confirm the emergency details.

### ER-4: History Log
- Every emergency submission must be recorded in the app's history log.
- Each log entry must include:
  - Timestamp
  - Emergency type (selected or custom text)
  - Additional details (from free-text field)
  - Solved status

## Acceptance Criteria
- [ ] Red emergency button is visible and tappable on the main screen.
- [ ] Pressing the button opens the emergency modal.
- [ ] Modal contains the predefined emergency list and a free-text input.
- [ ] Modal contains a "Solved" checkbox.
- [ ] Submitting the form places a call to 112.
- [ ] Emergency entry is saved to the history log with timestamp, type, details, and solved status.
- [ ] History log is accessible from the app navigation.

## Notes
- The call to 112 should respect platform permissions (iOS/Android).
- The modal should be dismissible if the user cancels before submitting.
- The history log should persist across app restarts.