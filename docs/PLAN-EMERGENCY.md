# Emergency Button Feature Plan

## Objective
Implement a prominent red emergency button that triggers a modal form for emergency details, initiates a call to 112, 
and logs emergency history per SPEC §4.10 and DECISIONS.md.

## Phases

### 1. Documentation Alignment (DONE)
- Reference DECISIONS.md for authentication/storage conventions
- Ensure Spanish (es-ES) localization per chat.js guardrail
- Adhere to mobile usability standards (44–48px touch targets)

### 2. UI/UX Design
- Position button per LAUNCH.md navigation patterns
- Prototype modal form with:
  - Predefined emergency list (Fall/Faint/Choking/etc.)
  - Custom text field
  - "Solved" checkbox
  - Cancel/Submit actions

### 3. Integration Planning
- Coordinate with chat.js for emergency context handling
- Plan R2 object permissions for history logs (DECISIONS.md D2)
- Ensure call-to-113 respects platform permissions (iOS/Android)

### 4. Testing Requirements
- Add emergency-button e2e tests to test:r2 suite
- Validate modal dismissibility and form submission flows

## Dependencies
- Requires db:migrate for history log schema
- Depends on auth system for user context in emergency logs

## Next Steps
1. Create UI mockups
2. Update SPEC.md with emergency-button API details
3. Schedule tester agent run