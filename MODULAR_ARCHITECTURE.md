# Modular Clean Architecture

This application uses a **Modular Clean Architecture** where each feature is a self-contained module with all its layers (domain, application, infrastructure, presentation).

## Architecture Overview

Each module is independently structured with the four core layers of Clean Architecture, allowing for:

- **High cohesion** - Related functionality is grouped together
- **Low coupling** - Modules depend on abstractions, not implementations
- **Testability** - Each module can be tested independently
- **Scalability** - New features can be added as new modules

## Directory Structure

```
src/
├── modules/                    # Feature modules
│   ├── user/                 # User management module
│   │   ├── domain/           # Core business logic
│   │   │   ├── entities/    # Domain entities
│   │   │   └── repositories/ # Repository interfaces
│   │   ├── application/      # Business logic & orchestration
│   │   │   ├── services/    # Application services
│   │   │   └── schemas/     # Zod validation schemas
│   │   ├── infrastructure/   # Technical implementations
│   │   │   └── repositories/ # Repository implementations (Prisma)
│   │   └── presentation/     # HTTP layer
│   │       ├── controllers/  # Express controllers
│   │       └── routes/      # Express routes
│   ├── auth/                 # Authentication module
│   ├── animal/               # Animal management module
│   ├── breeding/             # Breeding records module
│   ├── health/               # Health records module
│   ├── production/           # Production records module
│   └── sync/                 # Synchronization module
├── infrastructure/            # Shared infrastructure
│   ├── database/            # Prisma client configuration
│   └── openapi/             # OpenAPI documentation
├── presentation/             # Shared presentation
│   ├── middlewares/         # Global Express middlewares
│   └── routes/              # Main routes index
└── shared/                   # Shared utilities
    ├── errors/              # Custom error classes
    ├── utils/               # Helper functions (bcrypt, jwt)
    └── constants/           # Configuration constants
```

## Module Structure

Each module follows this exact structure:

```
src/modules/{module-name}/
├── domain/
│   ├── entities/          # Domain entities (pure data)
│   │   └── {EntityName}.ts
│   └── repositories/      # Repository interfaces
│       └── I{EntityName}Repository.ts
├── application/
│   ├── services/          # Business logic
│   │   └── {ModuleName}Service.ts
│   └── schemas/           # Zod schemas (DTOs)
│       └── {moduleName}.schema.ts
├── infrastructure/
│   └── repositories/      # Technical implementations
│       └── {EntityName}Repository.ts
└── presentation/
    ├── controllers/       # Express controllers
    │   └── {ModuleName}Controller.ts
    └── routes/            # Express routes
        └── {moduleName}.routes.ts
```

## Layer Responsibilities

### Domain Layer

**Purpose:** Define core business entities and rules

- **Entities:** Pure data structures representing business concepts
- **Repository Interfaces:** Abstract data access contracts
- **No dependencies:** Independent of infrastructure, framework, or database

Example:

```typescript
// src/modules/user/domain/entities/User.ts
export interface User {
  id: string;
  dni: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Application Layer

**Purpose:** Orchestrate business logic and use cases

- **Services:** Contain business logic and coordinate repositories
- **Schemas:** Zod validation schemas for input/output
- **Dependencies:** Depend only on domain abstractions

Example:

```typescript
// src/modules/user/application/services/UserService.ts
@injectable()
export class UserService {
  constructor(
    @inject(TYPE_IUserRepository) private userRepository: IUserRepository,
  ) {}

  async findById(id: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }
    return UserMapper.toResponse(user);
  }
}
```

### Infrastructure Layer

**Purpose:** Implement technical details and external integrations

- **Repositories:** Concrete implementations of data access (Prisma)
- **Dependencies:** Implement domain interfaces
- **Database:** Use Prisma ORM for database operations

Example:

```typescript
// src/modules/user/infrastructure/repositories/UserRepository.ts
@injectable()
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }
}
```

### Presentation Layer

**Purpose:** Handle HTTP requests and responses

- **Controllers:** Express route handlers
- **Routes:** Route definitions with middleware
- **Dependencies:** Depend on application services

Example:

```typescript
// src/modules/user/presentation/controllers/UserController.ts
@injectable()
export class UserController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {}

  getById = asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const result = await this.userService.findById(id);
    res.status(200).json(result);
  });
}
```

## Key Patterns

### 1. Dependency Injection (InversifyJS)

All services and controllers use dependency injection:

```typescript
@injectable()
export class UserService {
  constructor(
    @inject(TYPE_IUserRepository) private userRepository: IUserRepository,
  ) {}
}
```

### 2. Repository Pattern

Abstract data access behind interfaces:

```typescript
// Domain interface
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(data: UserCreateInput): Promise<User>;
}

// Infrastructure implementation
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({ where: { id } });
  }
}
```

### 3. Zod Schemas (No DTOs)

Use Zod for validation with inferred types:

```typescript
export const userCreateSchema = z.object({
  dni: z.string().length(8).describe("DNI number"),
  password: z.string().min(6).describe("Password"),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
```

### 4. Error Handling

Custom error classes for different scenarios:

```typescript
throw new NotFoundError("Usuario no encontrado");
throw new ConflictError("El usuario ya existe");
throw new AuthenticationError("Credenciales inválidas");
```

## Data Flow

```
HTTP Request
    ↓
Route Middleware (validation, auth)
    ↓
Controller
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
Database (Prisma)
    ↓
Entity
    ↓
Service (mapper to response)
    ↓
Controller (response)
    ↓
HTTP Response
```

## Creating a New Module

For detailed instructions, see [NEW_MODULE_GUIDE.md](NEW_MODULE_GUIDE.md).

Quick steps:

1. Create module structure:

   ```bash
   mkdir -p src/modules/{module-name}/{domain,application,infrastructure,presentation}/{entities,repositories,services,schemas,controllers,routes}
   ```

2. Implement domain layer (entities, repository interfaces)

3. Implement application layer (services, schemas)

4. Implement infrastructure layer (repository implementations)

5. Implement presentation layer (controllers, routes)

6. Register routes in `src/presentation/routes/index.ts`

## Cross-Module Communication

Modules communicate through:

- **Services:** Direct import of other module's services
- **Repositories:** Direct import of other module's repositories (when needed)

Example:

```typescript
// In production service
import { UserRepository } from "../../../user/infrastructure/repositories/UserRepository";
```

## Benefits

- **Modularity:** Each feature is encapsulated in its own module
- **Scalability:** Easy to add new modules without affecting existing ones
- **Maintainability:** Code is organized and easy to locate
- **Testability:** Each module can be tested independently
- **Team Collaboration:** Different teams can work on different modules

## For More Information

- [Creating New Modules](NEW_MODULE_GUIDE.md) - Step-by-step guide
- [Architecture Documentation](src/modules/ARCHITECTURE.md) - Detailed docs
- [Naming Conventions](src/modules/NAMING_CONVENTIONS.md) - Naming guide
- [Agent Guidelines](AGENTS.md) - Guidelines for agentic coding
