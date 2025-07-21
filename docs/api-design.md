# Checkpoint API Design Specification

## Overview

RESTful API design for the standup application, focusing on endpoints for managing users, standups, and authentication. 

## Base URL

```
Development: http://localhost:3001/api/v1
Production: https://api.standupapp.com/v1
```

## Authentication

The API uses JWT-based authentication. All endpoints except for authentication-related ones require a valid JWT token in the `Authorization` header.

### Headers

Protected endpoints require the following header:

```
Authorization: Bearer <token>
```

## Common Responses 

### Success Response

```json
{
  "status": 200, // 201, etc.
  "data": {...},
  "message": "Success" 
}
```

### Error Response

```json
{
  "status": 400, // 401, 404, etc.
  "message": "Detailed error message"
}
```

### Pagination Response

```json
{
  "status": 200,
  "data": [...],
  "message": "Success",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Endpoints

### Authentication

#### Register User

```
POST /auth/register
```

Request Body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "timezone": "Auckland/Auckland"
}
```

Response (201 Created):
```json
{
  "message": "Successfully registered",
  "data": {
    "user": {
      "id": "60d5eca77dd70b1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "timezone": "Auckland/Auckland"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

##### Validation

- **Email**: Valid email format, max 255 characters, unique
- **Password**: Min 8 characters, must contain uppercase, lowercase, and number
- **Name**: 2-100 characters, alphanumeric and spaces only
- **Timezone**: Must be valid IANA timezone

#### Login User

```
POST /auth/login
```

Request Body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```


Response (200):

```json
{
  "message": "Successfully logged in",
  "data": {
    "user": {
      "id": "60d5eca77dd70b1234567890",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Logout User

```
POST /auth/logout
Authorization: Bearer <token>
```

Request Body:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

Response (200):
```json
{
  "message": "Successfully logged out"
}
```

#### Refresh Token

```
POST /auth/refresh
```

Request Body:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

Response (200):
```json
{
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```


#### Logout All Devices

```
POST /auth/logout-all
Authorization: Bearer <token>
```

Response (200):
```json
{
  "message": "Logged out from all devices"
}
```

### Users

#### Get Current User

```
GET /users/me
Authorization: Bearer <token>
```

Response (200):
```json
{
  "message": "User retrieved successfully",
  "data": {
    "id": "60d5eca77dd70b1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "timezone": "Auckland/Auckland",
    "profileImage": "https://example.com/profile.jpg"
  }
}
```

#### Update User Profile

```
PATCH /users/me
Authorization: Bearer <token>
```

Request Body:
```json
{
  "name": "Jane Doe",
  "profileImage": "https://example.com/new-profile.jpg"
}
```

Response (200):
```json
{
  "message": "User profile updated successfully",
  "data": {
    "id": "60d5eca77dd70b1234567890",
    "email": "user@example.com",
    "name": "Jane Doe",
    "profileImage": "https://example.com/new-profile.jpg"
  }
}
```

### Standups

#### Create Standup

```
POST /standups
Authorization: Authorization <token>
```

Request Body:
```json
{
  "yesterday": "Completed feature X",
  "today": "Working on feature Y",
  "blockers": "Need access to database",
  "status": "submitted", // defaults to draft 
  "date": "2023-10-01" // Optional, defaults to current date
}
```

Response (201 Created):
```json
{
  "message": "Standup created successfully",
  "data": {
    "id": "60d5eca77dd70b1234567890",
    "userId": "60d5eca77dd70b1234567890",
    "date": "2023-10-01",
    "yesterday": "Completed feature X",
    "today": "Working on feature Y",
    "blockers": "Need access to database",
    "status": "submitted",
    "createdAt": "2023-10-01T00:00:00Z",
    "updatedAt": "2023-10-01T00:00:00Z"
  }
}
```

##### Standup Validation
- **Yesterday/Today/Blockers**: Max 1000 characters each
- **Date**: ISO format (YYYY-MM-DD), cannot be more than 7 days in the past or in the future
- **Status**: Enum - "draft" or "submitted"

#### Update Standup

```
PATCH /standups/:id
Authorization: Bearer <token>
``` 

Request Body:
```json
{
  "yesterday": "Updated yesterday's tasks",
  "today": "Updated today's tasks",
  "blockers": "Updated blockers",
  "status": "submitted" // Optional, defaults to draft
}
```

Response (200):
```json
{
  "message": "Standup updated successfully",
  "data": {
    "id": "60d5eca77dd70b1234567890",
    "userId": "60d5eca77dd70b1234567890",
    "date": "2023-10-01",
    "yesterday": "Updated yesterday's tasks",
    "today": "Updated today's tasks",   
    "blockers": "Updated blockers",
    "status": "submitted",
    "createdAt": "2023-10-01T00:00:00Z",
    "updatedAt": "2023-10-01T00:00:00Z"
  }
}
```

#### Get Standup

#### GET /standups

A flexible endpoint that serves multiple use cases through query parameters.

**Endpoint:** `GET /standups`

**Use Cases:**
- Team view: Today's standups for all team members
- History view: Paginated standup history for a user
- Date range: Get standups within a date range
- My standups: Current user's standups (default)

**Query Parameters:**
- `userId` - Filter by specific user
- `date` - Filter by specific date (YYYY-MM-DD)
- `dateFrom` - Start date for range query
- `dateTo` - End date for range query
- `status` - Filter by status (draft/submitted)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field (date/createdAt/updatedAt)
- `order` - Sort order (asc/desc)

```
For Team View - filter by date or by user
GET /standups?date=2025-01-20&status=submitted&userId=60d5eca77dd70b1234567890
Authorization: Bearer <token>
```

Response (200):
```json
{
  "message": "Standup retrieved successfully",
  "data": [
    {
      "id": "60d5eca77dd70b1234567891",
      "userId": "60d5eca77dd70b1234567890",
      "date": "2025-01-20T00:00:00.000Z",
      "yesterday": "Completed authentication module",
      "today": "Working on standup API endpoints",
      "blockers": "None",
      "status": "submitted",
      "createdAt": "2025-01-20T09:00:00.000Z",
      "user": {
        "id": "60d5eca77dd70b1234567890",
        "name": "John Doe",
        "email": "john@example.com",
        "profileImage": "https://..."
      }
    },
  ]
}
``` 

```
For History View

GET /standups?userId=60d5eca77dd70b1234567890&page=1&limit=10&sort=date&order=desc
Authorization: Bearer <token>
```

Response (200):
```json
{
  "message": "Standup history retrieved successfully",
  "data": [
    {
      "id": "60d5eca77dd70b1234567891",
      "userId": "60d5eca77dd70b1234567890",
      "date": "2025-01-20T00:00:00.000Z",
      "yesterday": "Completed authentication module",
      "today": "Working on standup API endpoints",
      "blockers": "None",
      "status": "submitted",
      "createdAt": "2025-01-20T09:00:00.000Z"
    },
    {
      "id": "60d5eca77dd70b1234567892",
      "userId": "60d5eca77dd70b1234567890",
      "date": "2025-01-19T00:00:00.000Z",
      "yesterday": "Started authentication module",
      "today": "Completing auth and tests",
      "blockers": "None",
      "status": "submitted",
      "createdAt": "2025-01-19T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "hasMore": true
  }
}
```


## Error Codes


All errors follow a consistent format with specific error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid or malformed token |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Invalid refresh token |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `STANDUP_NOT_FOUND` | 404 | Standup does not exist |
| `STANDUP_ALREADY_EXISTS` | 409 | Standup already exists for this date |
| `STANDUP_EDIT_PAST_DATE` | 400 | Cannot edit standups from past dates |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |


## Security Considerations

- **CORS**: Configured for frontend domain only
- **HTTPS**: Required in production 
- **Input Sanitization**: All inputs sanitized to prevent XSS
- **SQL Injection**: Prevented through parameterized queries
- **Password Storage**: Bcrypt with minimum 10 rounds
- **JWT Secret**: Minimum 256-bit key
- **Token Expiry**: Access tokens expire in 15 minutes, refresh tokens in 30 days

## API Versioning

- Version included in URL path (e.g., `/v1/`)
- Breaking changes will increment major version
- Non-breaking changes increment minor version

## Monitoring & Logging

- All requests logged with correlation IDs
- Error tracking for 5xx errors
- Performance monitoring for response times
- Health check endpoint for uptime monitoring