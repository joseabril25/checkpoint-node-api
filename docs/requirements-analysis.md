
# Checkpoint - Requirements Analysis

Core Purpose: An asynchronous daily standup tracker that replaces synchronous meetings with a lightweight, persistent record of team progress.

Target Users: Development teams (likely 3-15 members) who work asynchronously or across time zones.

The app should let team members log:

    What they did yesterday
    What they plan to do today
    Any blockers they're facing

This project is about clean implementation, intuitive UX, and solid full-stack fundamentals. Keep the scope tight but thoughtful.

# Functional Requirements Analysis

## User Accounts

### Requirements


    Sign up / log in / log out
    Can be mocked (e.g., assume one user) or implemented with JWT/session auth

### Assumptions

    Email-baed Authentication
    No password reset for MVP (Can be added)
    Single-team context 

### Implementation

    JWT-based authentication with refresh tokens for better security and easier implementation
    Store minimal user profile (name, email, password, profile pic)

## Daily Updates

### Given Requirements

    1 standup entry per day per user
    Fields yesterday, today, blockers
    Ability to edit

### Assumptions 

    Day is based on the user's timezone
    No character limits on each input field
    Edit history not required for MVPs
    Can't submit future standups

### Edge Cases

    Weekend/Holiday (no enforcement of daily entries)
    Multiple edits are allowed

## Team View

### Given Requirements

    Display most recent standup from each team member
    Optional filters: date, user

### Assumptions

    Most recent - means last submitted standup and could be from previous days
    Should show date of each standup

### UX Considerations

    Quick visual scan is priority (card-based layout)
    Blockers should be prominently displayed
    Show "No standup yet" for team members who haven't submitted

## History View

### Given Requirements

    View previous standups
    Filter/Sort by date

### Assumptions

    User's history only not team history
    Pagination or infinite scrolling
    Default to show latest

## Bonus Features Analysis

# Non-FUnctional Requirements

## Performance

    Fast page load
    Optimistic UI updates
    Fast API responses

## Security

    JWT with 7-day expiry
    Refresh tokens with 30-day expiry
    Input sanitation
    Rate limiting
    API endpoint validation

## Scalability

    Design to scale to 100 teams or 100 users
    MongoDB indexes on userId + date queries
    Consider caching layer for team view

## Constraints

    7-day timeline (Now 5, started late :( )
    Must use React, TS, Node.js, MongoDB
    Must be deployed and accessible

# Scope 

## In Scope

    Core CRUD operations for standups
    Basic Auth flow
    Team View
    History View (Personal)
    Mobile responsive
    "Wow" Bonus Feature

## Out of Scope

    Email notif
    Slack/Teams Integration 
    Multiple teams
    Analytics

# Technical Decisions

## Tech Stack

    React Vite
    TailwindCSS
    Node.js
    Monorepo ?
    Redux + Redux Toolkit

## Implementation priority

    1. Backend API + Auth + Database
    2. Frontend Components + Page Views
    3. API Integration
    4. Testing, Polishing, Documentation
    5. Deployment
    6. CI/CD 




