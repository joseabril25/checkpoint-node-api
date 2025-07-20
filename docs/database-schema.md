# Database Schema Design

## Overview

This document outlines the database schema for the standup application, focusing on the core entities and their relationships. The schema is designed to support the application's requirements for managing standups, teams, and user authentication.

## Collections

### Users Collection

```javascript
{
  _id: ObjectId,
  email: string, // Unique email for user authentication              
  password: string, // Hashed password for security 
  name: string,                  
  profileImage: string?,                 
  timezone: string, // e.g., "America/New_York"
  status: string, // e.g., "active", "inactive"       
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
- `email` (unique)
- `status`

## Standups Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to Users collection
  date: Date, // Date of the standup entry
  yesterday: string, // What the user did yesterday
  today: string, // What the user plans to do today
  blockers: string, // Any blockers the user is facing
  status: string, // e.g., "draft", "submitted"
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:
- `userId, date` Compound unique index - enforces one standup entry per user per day on the database level
- `date, createdAt` for efficient querying of standups by date
- `status` for filtering by entry status

Index Design Rationale:

- The compound userId + date index eliminates need for separate userId index
- The date + createdAt compound index serves dual purpose (date filtering + sorting)
- Total indexes reduced from 4 to 3 while improving query performance

## Refresh Tokens Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to Users collection
  token: string, // JWT refresh token
  userAgent?: string, // Optional user agent for security
  ipAddress?: string, // Optional IP address for security
  lastUsedAt: Date, // Last time this token was used
  expiresAt: Date, // Expiration date of the token
  createdAt: Date,
}
```

Indexes:
- `token` (unique) for quick lookup
- `userId` for quick lookup of tokens by user
- `expiresAt` for cleanup of expired tokens

Rationale:
- Allows logout from all devices
- Tracks active sessions per user
- Automatic cleanup of expired tokens via mongoDB TTL index on `expiresAt`

## Relationships

- **Users to Standups**: One-to-Many relationship. Each user can have multiple standup entries, but each standup entry belongs to one user.
- **Users to Refresh Tokens**: One-to-Many relationship. Each user can have multiple refresh tokens, but each refresh token belongs to one user.
- **Standups to Users**: Each standup entry references a user via `userId`, establishing a link back to the Users collection.
- **Refresh Tokens to Users**: Each refresh token references a user via `userId`, establishing a link back to the Users collection.

## Authentication Approach

Production-ready dual-token authentication system using JWTs.

### Access Tokens (JWT)
- Short-lived (e.g., 15 minutes)
- Used for API requests
- Stateless and not stored in the database
- Contains user ID

### Refresh Tokens
- Long-lived (e.g., 30 days)
- Stored in the database
- Used to obtain new access tokens
- Can be revoked (e.g., on logout)

### Security Considerations
- Passwords should be hashed using a strong algorithm (e.g., bcrypt).
- Refresh tokens should be stored securely and rotated regularly.
- User sessions should be monitored for unusual activity (e.g., multiple logins from different locations).
- Implement rate limiting on login attempts to prevent brute force attacks.
- Consider using HTTPS to encrypt data in transit.

This approach balances security and usability, allowing users to stay logged in while maintaining the ability to revoke access when necessary.

