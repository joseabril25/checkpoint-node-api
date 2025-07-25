# Checkpoint Node API

A robust REST API for managing team standups and user authentication, built with Node.js, TypeScript, and MongoDB.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Standup Management**: Create, read, update standups with markdown support
- **User Management**: User profiles and team management
- **Pagination & Filtering**: Advanced query capabilities
- **Input Validation**: Comprehensive request validation
- **TypeScript**: Full type safety throughout the application
- **Testing**: Comprehensive test suite with Jest
- **Database**: MongoDB with Mongoose ODM

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

## 🏃 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd checkpoint-node-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/checkpoint-api

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| POST | `/auth/refresh-token` | Refresh access token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |

### Standups
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/standups` | Get standups (with filters) | Yes |
| POST | `/standups` | Create new standup | Yes |
| PATCH | `/standups/:id` | Update standup | Yes |

### Users
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get users list | Yes |

### Example Requests

#### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "timezone": "UTC"
  }'
```

#### Create Standup
```bash
curl -X POST http://localhost:3000/api/v1/standups \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=your-jwt-token" \
  -d '{
    "yesterday": "Completed **authentication** module with [JWT](https://jwt.io)",
    "today": "Working on standup functionality",
    "blockers": "None",
    "status": "submitted"
  }'
```

#### Get Standups with Filters
```bash
# Get today's standups for all users
curl http://localhost:3000/api/v1/standups

# Get user's standups
curl "http://localhost:3000/api/v1/standups?userId=USER_ID"

# Get standups for specific date
curl "http://localhost:3000/api/v1/standups?date=2024-01-15"
```

## 🛠 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Building
npm run build        # Compile TypeScript to JavaScript
npm start           # Run production build

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint        # Check TypeScript compilation
```

### Development Workflow

1. **Make changes** to the codebase
2. **Run tests** to ensure everything works: `npm test`
3. **Check TypeScript** compilation: `npm run lint`
4. **Commit changes** following conventional commit format
5. **Push to repository** - deployment happens automatically

## 🧪 Testing

The project includes comprehensive testing with Jest:

- **Unit Tests**: Individual functions and methods
- **Integration Tests**: API endpoints and database operations
- **Repository Tests**: Database layer testing
- **Service Tests**: Business logic testing
- **Controller Tests**: HTTP request/response testing

### Test Structure
```
src/
├── api/
│   └── **/__tests__/
├── storage/
│   └── repositories/__tests__/
└── tests/
    └── setup.ts
```

### Running Tests
```bash
# All tests
npm test

# Specific test suite
npm test auth
npm test standup

# Single test file
npm test auth.service.test.ts

# With coverage
npm run test:coverage
```

## 🚀 Deployment

### Railway Deployment (Recommended)

1. **Connect your repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** on every push to main/master

Required environment variables for production:
```env
Same as development, but ensure MONGODB_URI points to your production database
```

#### Railway api URL:

```
https://checkpoint-node-api-production.up.railway.app/
```

### Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
checkpoint-node-api/
├── src/
│   ├── api/                    # API routes and controllers
│   │   ├── auth/              # Authentication endpoints
│   │   ├── standups/          # Standup endpoints
│   │   └── users/             # User endpoints
│   ├── common/                # Shared utilities
│   │   ├── middleware/        # Express middleware
│   │   ├── types/            # Common type definitions
│   │   └── utils/            # Utility functions
│   ├── models/               # Mongoose models and schemas
│   ├── storage/              # Data access layer
│   │   └── repositories/     # Repository pattern implementation
│   ├── types/                # TypeScript type definitions
│   ├── tests/                # Test configuration
│   ├── app.ts               # Express app configuration
│   └── server.ts            # Server entry point
├── dist/                    # Compiled JavaScript (generated)
├── docs/                    # Documentation
├── jest.config.ts          # Jest configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🔧 Technical Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Validation**: class-validator
- **Testing**: Jest with MongoDB Memory Server
- **Documentation**: TypeScript + JSDoc

## 📝 API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "status": 200,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Paginated Response
```json
{
  "status": 200,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "status": 400,
  "message": "Error message",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {...}
  }
}
```

## 🎯 Features

### Markdown Support
Standup entries (`yesterday`, `today`, `blockers`) support markdown formatting:

```markdown
# Yesterday
- Completed **authentication** module
- Fixed [bug #123](https://github.com/repo/issues/123)
- Reviewed PR for database migration

# Today  
- Implement standup CRUD operations
- Add pagination to user endpoints
- `code review` session at 2 PM

# Blockers
> Waiting for API key from third-party service
```

### Authentication Flow
1. **Register/Login** → Receive JWT access token + refresh token
2. **API Requests** → Include access token in cookies
3. **Token Refresh** → Automatically refresh expired tokens
4. **Logout** → Invalidate tokens

### Query Filtering
Advanced filtering capabilities for standups:

```bash
# Filter by user
GET /standups?userId=USER_ID

# Filter by date range  
GET /standups?dateFrom=2024-01-01&dateTo=2024-01-31

# Filter by status
GET /standups?status=submitted

# Pagination
GET /standups?page=2&limit=20

# Sorting
GET /standups?sort=createdAt&order=asc
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues**
```bash
# Check if MongoDB is running locally
mongosh

# Or verify your MongoDB Atlas connection string
```

**JWT Token Issues**
```bash
# Ensure JWT_SECRET is set in environment variables
echo $JWT_SECRET
```

**Port Already in Use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**TypeScript Compilation Errors**
```bash
# Check TypeScript configuration
npm run lint
```

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

Built with ❤️ using Node.js and TypeScript