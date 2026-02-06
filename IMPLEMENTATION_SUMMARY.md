# Ayllu Gen Backend - Modular Clean Architecture Implementation

## Modular Structure Implemented

The project has been completely restructured to use **Modular Clean Architecture** where each feature is a self-contained module with all layers (domain, application, infrastructure, presentation).

```
src/
├── modules/                      # Feature modules (each has full clean architecture)
│   ├── user/                    # User management module
│   │   ├── domain/
│   │   │   ├── entities/User.ts
│   │   │   └── repositories/IUserRepository.ts
│   │   ├── application/
│   │   │   ├── services/UserService.ts
│   │   │   └── schemas/user.schema.ts
│   │   ├── infrastructure/
│   │   │   └── repositories/UserRepository.ts
│   │   └── presentation/
│   │       ├── controllers/UserController.ts
│   │       └── routes/user.routes.ts
│   ├── auth/                    # Authentication module
│   │   ├── domain/
│   │   │   ├── entities/RefreshToken.ts
│   │   │   └── repositories/IRefreshTokenRepository.ts
│   │   ├── application/
│   │   │   ├── services/AuthService.ts
│   │   │   └── schemas/auth.schema.ts
│   │   ├── infrastructure/
│   │   │   └── repositories/RefreshTokenRepository.ts
│   │   └── presentation/
│   │       ├── controllers/AuthController.ts
│   │       └── routes/auth.routes.ts
│   ├── animal/                  # Animal management module
│   ├── breeding/                # Breeding records module
│   ├── health/                  # Health records module
│   ├── production/              # Production records module
│   └── sync/                    # Synchronization module
├── infrastructure/              # Shared infrastructure
│   ├── database/prisma/         # Prisma client
│   └── openapi/                 # OpenAPI documentation
├── presentation/                # Shared presentation
│   ├── middlewares/             # Global middlewares
│   └── routes/                  # Main routes index
└── shared/                       # Shared utilities
    ├── di/                      # Dependency Injection (InversifyJS)
    ├── errors/                  # Custom error classes
    ├── utils/                   # Helper functions (bcrypt, jwt)
    └── constants/               # Configuration constants
```

## Implemented Modules

### 1. User Module

**Location:** `src/modules/user/`

- **Domain:** Entity `User` and interface `IUserRepository`
- **Application:** Service `UserService` and Zod schemas
- **Infrastructure:** Implementation `UserRepository` with Prisma
- **Presentation:** Controller `UserController` and routes

**Features:**

- Get current user profile
- Get user by ID
- Delete user

### 2. Auth Module

**Location:** `src/modules/auth/`

- **Domain:** Entity `RefreshToken` and interface `IRefreshTokenRepository`
- **Application:** Service `AuthService` (register, login, refresh, logout) and Zod schemas
- **Infrastructure:** Implementation `RefreshTokenRepository` with Prisma
- **Presentation:** Controller `AuthController` and routes

**Features:**

- Register new user
- Login with DNI and password
- Refresh access token
- Logout user

**Dependencies:** Imports `UserRepository` from user module

### 3. Animal Module

**Location:** `src/modules/animal/`

**Features:**

- CRUD operations for animals
- Animal management with breeding records

### 4. Breeding Module

**Location:** `src/modules/breeding/`

**Features:**

- CRUD operations for breeding records
- Track animal breeding history

### 5. Health Module

**Location:** `src/modules/health/`

**Features:**

- CRUD operations for health records
- Track animal health information

### 6. Production Module

**Location:** `src/modules/production/`

**Features:**

- CRUD operations for production records
- Track animal production data

### 7. Sync Module

**Location:** `src/modules/sync/`

**Features:**

- Data synchronization functionality

## Key Technologies

- **TypeScript** - Type-safe development with strict mode
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM with PostgreSQL
- **Zod** - Schema validation and type inference
- **InversifyJS** - Dependency Injection
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Winston** - Production-grade logging
- **Swagger/OpenAPI** - API documentation

## Architecture Highlights

### 1. Modular Design

Each feature is a self-contained module:

- **High cohesion** - Related functionality grouped together
- **Low coupling** - Modules depend on abstractions, not implementations
- **Independent** - Each module can be developed and tested independently

### 2. Clean Architecture Layers

Each module contains four layers:

- **Domain** - Core business entities and repository interfaces
- **Application** - Business logic and Zod schemas (no DTOs)
- **Infrastructure** - Technical implementations (Prisma repositories)
- **Presentation** - HTTP layer (Express controllers and routes)

### 3. Dependency Injection

Using InversifyJS for loose coupling:

- All services, controllers, and repositories use `@injectable()` decorator
- Dependencies injected with `@inject(TYPES.Xxx)` pattern
- Easy to mock for testing

### 4. Zod Schemas

No manual DTOs - use Zod with inferred types:

```typescript
export const userCreateSchema = z.object({
  dni: z.string().length(8).describe("DNI number"),
  password: z.string().min(6).describe("Password"),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
```

### 5. Error Handling

Custom error classes:

- `NotFoundError` (404)
- `ConflictError` (409)
- `AuthenticationError` (401)
- `ValidationError` (400)

All errors automatically logged with Winston.

## Cross-Module Communication

Modules communicate through direct imports:

```typescript
// Auth module importing User module
import { UserRepository } from "../../../user/infrastructure/repositories/UserRepository";
```

## Documentation

All documentation files have been updated with the new modular architecture:

- **[AGENTS.md](AGENTS.md)** - Guidelines for agentic coding (updated)
- **[README.md](README.md)** - Project overview and setup (updated)
- **[MODULAR_ARCHITECTURE.md](MODULAR_ARCHITECTURE.md)** - Complete modular architecture guide (updated)
- **[NEW_MODULE_GUIDE.md](NEW_MODULE_GUIDE.md)** - Step-by-step module creation guide (updated)
- **[OPENAPI_ARCHITECTURE.md](OPENAPI_ARCHITECTURE.md)** - OpenAPI documentation architecture (updated)
- **[src/modules/ARCHITECTURE.md](src/modules/ARCHITECTURE.md)** - Detailed architecture documentation
- **[src/modules/NAMING_CONVENTIONS.md](src/modules/NAMING_CONVENTIONS.md)** - Naming conventions guide

## Available Commands

### Development

```bash
npm run dev              # Start development server with hot reload
npm run build           # Compile TypeScript to dist/
npm start               # Run production server
```

### Code Quality

```bash
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

### Testing

```bash
npm test                # Run all tests
jest path/to/file.test.ts  # Run single test file
jest -t "testName"      # Run tests matching pattern
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
```

### Database

```bash
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations in dev
npm run prisma:push     # Push schema changes to database
npm run prisma:studio   # Open Prisma Studio UI
```

## Benefits of Modular Architecture

1. **Scalability** - Each feature is independent and can grow without affecting others
2. **Organization** - Easier to navigate and understand the codebase
3. **Maintainability** - Changes in one module don't affect others
4. **Testability** - Each module can be tested in isolation
5. **Team Collaboration** - Different teams can work on different modules simultaneously
6. **Code Reusability** - Shared infrastructure and utilities across modules
7. **Clear Boundaries** - Well-defined module boundaries and interfaces

## Creating a New Module

For detailed instructions, see [NEW_MODULE_GUIDE.md](NEW_MODULE_GUIDE.md).

Quick steps:

```bash
# Create directory structure
mkdir -p src/modules/{module-name}/{domain,application,infrastructure,presentation}/{entities,repositories,services,schemas,controllers,routes}
```

1. **Domain Layer:** Create entities and repository interfaces
2. **Application Layer:** Implement services and Zod schemas
3. **Infrastructure Layer:** Implement repositories with Prisma
4. **Presentation Layer:** Create controllers and routes
5. **DI Container:** Register in `src/shared/di/container.ts` and `src/shared/di/types.ts`
6. **Routes:** Register in `src/presentation/routes/index.ts`
7. **Prisma Model:** Add model to `prisma/schema.prisma` (if needed)
8. **OpenAPI:** Add routes to `src/infrastructure/openapi/features/{module-name}.openapi.ts`

## API Documentation

Once the server is running:

- **OpenAPI JSON spec:** http://localhost:3000/api-docs
- **Swagger UI:** http://localhost:3000/api-docs/swagger

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `DELETE /api/users/:id` - Delete user

### Animals

- `GET /api/animals` - List all animals
- `GET /api/animals/:id` - Get animal by ID
- `POST /api/animals` - Create new animal
- `PUT /api/animals/:id` - Update animal
- `DELETE /api/animals/:id` - Delete animal

### Breeding

- `GET /api/breeding` - List all breeding records
- `GET /api/breeding/:id` - Get breeding record by ID
- `POST /api/breeding` - Create new breeding record
- `PUT /api/breeding/:id` - Update breeding record
- `DELETE /api/breeding/:id` - Delete breeding record

### Health

- `GET /api/health` - List all health records
- `GET /api/health/:id` - Get health record by ID
- `POST /api/health` - Create new health record
- `PUT /api/health/:id` - Update health record
- `DELETE /api/health/:id` - Delete health record

### Production

- `GET /api/production` - List all production records
- `GET /api/production/:id` - Get production record by ID
- `POST /api/production` - Create new production record
- `PUT /api/production/:id` - Update production record
- `DELETE /api/production/:id` - Delete production record

## Future Enhancements

Potential additions to the modular architecture:

- Additional modules as needed
- Enhanced error handling and logging
- Performance optimization
- Advanced testing strategies
- CI/CD pipeline integration
- Monitoring and observability

## For More Information

- [Agent Guidelines](AGENTS.md) - Guidelines for agentic coding
- [Modular Architecture](MODULAR_ARCHITECTURE.md) - Architecture overview
- [Creating New Modules](NEW_MODULE_GUIDE.md) - Module creation guide
- [OpenAPI Architecture](OPENAPI_ARCHITECTURE.md) - Documentation architecture
- [Architecture Documentation](src/modules/ARCHITECTURE.md) - Detailed docs
- [Naming Conventions](src/modules/NAMING_CONVENTIONS.md) - Naming conventions
