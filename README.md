# Ayllu Gen Backend

Backend API with Modular Clean Architecture, TypeScript, Express, Prisma, Swagger, Zod.

## Stack

- **Node.js** + **TypeScript**
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **Swagger** - API Documentation
- **Zod** - Validation
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Winston** - Production-grade logging
- **InversifyJS** - Dependency Injection
- **Custom Error Handling** - Structured error system with logging

## Key Features

- **Modular Clean Architecture** - Each feature is a self-contained module with all layers
- **Type-safe** - Full TypeScript with strict mode enabled
- **Environment Validation** - Startup validation of all configuration
- **Structured Error Handling** - Custom error classes with automatic logging
- **Production Logging** - Winston with request tracking, file rotation, and sampling
- **Request ID Tracking** - Unique request IDs for log correlation
- **API Documentation** - Interactive Swagger/OpenAPI docs
- **Security** - Helmet, CORS, JWT auth, bcrypt password hashing
- **Dependency Injection** - InversifyJS for loose coupling and testability

## Modular Clean Architecture

Each feature is a self-contained module with all layers:

```
src/
├── modules/                    # Feature modules (each has full clean architecture)
│   ├── user/                 # User module
│   │   ├── domain/           # Entities, repository interfaces
│   │   ├── application/      # Services, Zod schemas
│   │   ├── infrastructure/   # Repository implementations
│   │   └── presentation/      # Controllers, routes
│   ├── auth/                 # Auth module
│   ├── animal/               # Animal module
│   ├── breeding/             # Breeding module
│   ├── health/               # Health module
│   ├── production/           # Production module
│   └── sync/                 # Sync module
├── infrastructure/            # Shared infrastructure
│   ├── database/            # Prisma client
│   └── openapi/             # OpenAPI documentation
├── presentation/             # Shared presentation
│   ├── middlewares/         # Global middlewares
│   └── routes/              # Main routes
└── shared/                   # Shared utilities
    ├── errors/              # Custom error classes
    ├── utils/               # Helper functions (bcrypt, jwt)
    └── constants/           # Configuration constants
```

For detailed architecture documentation, see:

- [Modular Architecture Guide](MODULAR_ARCHITECTURE.md)
- [Creating New Modules](NEW_MODULE_GUIDE.md)
- [Architecture Documentation](src/modules/ARCHITECTURE.md)
- [Naming Conventions](src/modules/NAMING_CONVENTIONS.md)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
NODE_ENV="development"
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/ayllu_gen?schema=public"
JWT_SECRET="your-super-secret-jwt-key-must-be-at-least-32-characters-long"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

**Important**: The application validates all environment variables at startup:

- `JWT_SECRET` must be at least 32 characters
- `DATABASE_URL` must be a valid PostgreSQL connection string
- `PORT` must be between 1-65535
- `NODE_ENV` must be one of: `development`, `production`, `test`

3. Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:

```bash
npx prisma generate
```

## Usage

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run all tests
npm test

# Run a single test file
jest path/to/file.test.ts

# Run tests matching a pattern
jest -t "testName"

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations in dev
npm run prisma:migrate

# Push schema changes to database
npm run prisma:push

# Open Prisma Studio UI
npm run prisma:studio
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:3000/api-docs

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users/me` - Get current user (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)
- `DELETE /api/users/:id` - Delete user (requires auth)

### Animals

- `GET /api/animals` - List all animals (requires auth)
- `GET /api/animals/:id` - Get animal by ID (requires auth)
- `POST /api/animals` - Create new animal (requires auth)
- `PUT /api/animals/:id` - Update animal (requires auth)
- `DELETE /api/animals/:id` - Delete animal (requires auth)

### Breeding

- `GET /api/breeding` - List all breeding records (requires auth)
- `GET /api/breeding/:id` - Get breeding record by ID (requires auth)
- `POST /api/breeding` - Create new breeding record (requires auth)
- `PUT /api/breeding/:id` - Update breeding record (requires auth)
- `DELETE /api/breeding/:id` - Delete breeding record (requires auth)

### Health

- `GET /api/health` - List all health records (requires auth)
- `GET /api/health/:id` - Get health record by ID (requires auth)
- `POST /api/health` - Create new health record (requires auth)
- `PUT /api/health/:id` - Update health record (requires auth)
- `DELETE /api/health/:id` - Delete health record (requires auth)

### Production

- `GET /api/production` - List all production records (requires auth)
- `GET /api/production/:id` - Get production record by ID (requires auth)
- `POST /api/production` - Create new production record (requires auth)
- `PUT /api/production/:id` - Update production record (requires auth)
- `DELETE /api/production/:id` - Delete production record (requires auth)

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"dni": "12345678", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni": "12345678", "password": "password123"}'
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### Get Current User

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer your-access-token"
```

## Error Responses

All API errors follow a consistent format with an error message and code:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Validation errors include additional details:

```json
{
  "error": "Invalid data provided",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["dni"],
      "message": "String must contain exactly 8 character(s)"
    }
  ]
}
```

Common error codes:

- `VALIDATION_ERROR` (400) - Invalid request data
- `AUTHENTICATION_ERROR` (401) - Invalid or missing credentials
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists

## Documentation

- [Agent Guidelines](AGENTS.md) - Guidelines for agentic coding
- [Modular Architecture](MODULAR_ARCHITECTURE.md) - Complete modular architecture guide
- [Creating New Modules](NEW_MODULE_GUIDE.md) - Step-by-step module creation guide
- [Architecture Documentation](src/modules/ARCHITECTURE.md) - Detailed architecture documentation
- [Naming Conventions](src/modules/NAMING_CONVENTIONS.md) - Naming conventions guide

## License

MIT
