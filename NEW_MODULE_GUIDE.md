# Guide to Creating a New Module

This step-by-step guide shows how to create a new module in the modular clean architecture.

## Quick Start Commands

```bash
# Create module directory structure
mkdir -p src/modules/{module-name}/domain/{entities,repositories}
mkdir -p src/modules/{module-name}/application/{services,schemas}
mkdir -p src/modules/{module-name}/infrastructure/repositories
mkdir -p src/modules/{module-name}/presentation/{controllers,routes}
```

## Step 1: Domain Layer

### 1.1 Create Entity

**File:** `src/modules/{module-name}/domain/entities/{EntityName}.ts`

```typescript
export interface {EntityName} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface {EntityName}CreateInput {
  name: string;
}

export interface {EntityName}UpdateInput {
  name?: string;
}
```

### 1.2 Create Repository Interface

**File:** `src/modules/{module-name}/domain/repositories/I{EntityName}Repository.ts`

```typescript
import { {EntityName}, {EntityName}CreateInput, {EntityName}UpdateInput } from '../entities/{EntityName}';

export const TYPE_I{EntityName}Repository = Symbol("I{EntityName}Repository");

export interface I{EntityName}Repository {
  findById(id: string): Promise<{EntityName} | null>;
  findAll(): Promise<{EntityName}[]>;
  create(data: {EntityName}CreateInput): Promise<{EntityName}>;
  update(id: string, data: {EntityName}UpdateInput): Promise<{EntityName}>;
  delete(id: string): Promise<void>;
}
```

## Step 2: Application Layer

### 2.1 Create Zod Schemas (No Manual DTOs)

**File:** `src/modules/{module-name}/application/schemas/{moduleName}.schema.ts`

```typescript
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const create{EntityName}Schema = z
  .object({
    name: z.string().min(1).describe('Nombre de la entidad'),
  })
  .openapi({
    example: {
      name: 'Nombre de ejemplo',
    },
  });

export const update{EntityName}Schema = z
  .object({
    name: z.string().min(1).optional().describe('Nombre de la entidad'),
  })
  .openapi({
    example: {
      name: 'Nombre actualizado',
    },
  });

export const {entityName}ResponseSchema = z.object({
  id: z.string().uuid().describe('Identificador único'),
  name: z.string().describe('Nombre de la entidad'),
  createdAt: z.date().describe('Fecha de creación'),
  updatedAt: z.date().describe('Fecha de actualización'),
});

export type Create{EntityName}Input = z.infer<typeof create{EntityName}Schema>;
export type Update{EntityName}Input = z.infer<typeof update{EntityName}Schema>;
export type {EntityName}Response = z.infer<typeof {entityName}ResponseSchema>;
```

### 2.2 Create Service with Dependency Injection

**File:** `src/modules/{module-name}/application/services/{EntityName}Service.ts`

```typescript
import { injectable, inject } from 'inversify';
import {
  I{EntityName}Repository,
  TYPE_I{EntityName}Repository
} from '../../domain/repositories/I{EntityName}Repository';
import { {EntityName}Response, Create{EntityName}Input, Update{EntityName}Input } from '../schemas/{moduleName}.schema';
import { NotFoundError } from '../../../../shared/errors/AppError';

@injectable()
export class {EntityName}Service {
  constructor(
    @inject(TYPE_I{EntityName}Repository) private {entityName}Repository: I{EntityName}Repository
  ) {}

  async getById(id: string): Promise<{EntityName}Response> {
    const entity = await this.{entityName}Repository.findById(id);
    if (!entity) {
      throw new NotFoundError('Entidad no encontrada');
    }
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async getAll(): Promise<{EntityName}Response[]> {
    const entities = await this.{entityName}Repository.findAll();
    return entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    }));
  }

  async create(data: Create{EntityName}Input): Promise<{EntityName}Response> {
    const entity = await this.{entityName}Repository.create(data);
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async update(id: string, data: Update{EntityName}Input): Promise<{EntityName}Response> {
    const entity = await this.{entityName}Repository.update(id, data);
    return {
      id: entity.id,
      name: entity.name,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.{entityName}Repository.delete(id);
  }
}
```

## Step 3: Infrastructure Layer

### 3.1 Create Repository Implementation

**File:** `src/modules/{module-name}/infrastructure/repositories/{EntityName}Repository.ts`

```typescript
import { injectable } from 'inversify';
import {
  {EntityName},
  {EntityName}CreateInput,
  {EntityName}UpdateInput,
} from '../../domain/entities/{EntityName}';
import { I{EntityName}Repository } from '../../domain/repositories/I{EntityName}Repository';
import { prisma } from '../../../../infrastructure/database/prisma/client';

@injectable()
export class {EntityName}Repository implements I{EntityName}Repository {
  async findById(id: string): Promise<{EntityName} | null> {
    const entity = await prisma.{entityName}.findUnique({
      where: { id },
    });
    return entity;
  }

  async findAll(): Promise<{EntityName}[]> {
    const entities = await prisma.{entityName}.findMany();
    return entities;
  }

  async create(data: {EntityName}CreateInput): Promise<{EntityName}> {
    const entity = await prisma.{entityName}.create({
      data,
    });
    return entity;
  }

  async update(id: string, data: {EntityName}UpdateInput): Promise<{EntityName}> {
    const entity = await prisma.{entityName}.update({
      where: { id },
      data,
    });
    return entity;
  }

  async delete(id: string): Promise<void> {
    await prisma.{entityName}.delete({
      where: { id },
    });
  }
}
```

## Step 4: Presentation Layer

### 4.1 Create Controller

**File:** `src/modules/{module-name}/presentation/controllers/{EntityName}Controller.ts`

```typescript
import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { {EntityName}Service } from '../../application/services/{EntityName}Service';
import { asyncHandler } from '../../../../presentation/middlewares/asyncHandler.middleware';

@injectable()
export class {EntityName}Controller {
  constructor(@inject(TYPES.{EntityName}Service) private {entityName}Service: {EntityName}Service) {}

  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const result = await this.{entityName}Service.getAll();
    return res.status(200).json(result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await this.{entityName}Service.getById(id);
    return res.status(200).json(result);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body;
    const result = await this.{entityName}Service.create(data);
    return res.status(201).json(result);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = req.body;
    const result = await this.{entityName}Service.update(id, data);
    return res.status(200).json(result);
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.{entityName}Service.delete(id);
    return res.status(204).send();
  });
}
```

### 4.2 Create Routes

**File:** `src/modules/{module-name}/presentation/routes/{moduleName}.routes.ts`

```typescript
import { Router } from 'express';
import { container } from 'inversify';
import { {EntityName}Controller } from '../controllers/{EntityName}Controller';
import {
  create{EntityName}Schema,
  update{EntityName}Schema,
} from '../../application/schemas/{moduleName}.schema';
import { validate } from '../../../../presentation/middlewares/validation.middleware';
import { authMiddleware } from '../../../../presentation/middlewares/auth.middleware';

const router = Router();
const {entityName}Controller = container.get<{EntityName}Controller>(TYPES.{EntityName}Controller);

router.get('/', authMiddleware, {entityName}Controller.getAll);
router.get('/:id', authMiddleware, {entityName}Controller.getById);
router.post(
  '/',
  authMiddleware,
  validate(create{EntityName}Schema),
  {entityName}Controller.create,
);
router.put(
  '/:id',
  authMiddleware,
  validate(update{EntityName}Schema),
  {entityName}Controller.update,
);
router.delete('/:id', authMiddleware, {entityName}Controller.delete);

export default router;
```

## Step 5: Register in DI Container

Add to `src/shared/di/container.ts`:

```typescript
container.bind<I{EntityName}Repository>(TYPE_I{EntityName}Repository).to({EntityName}Repository);
container.bind<{EntityName}Service>(TYPES.{EntityName}Service).to({EntityName}Service);
container.bind<{EntityName}Controller>(TYPES.{EntityName}Controller).to({EntityName}Controller);
```

Add to `src/shared/di/types.ts`:

```typescript
{EntityName}Service: Symbol.for('{EntityName}Service'),
{EntityName}Controller: Symbol.for('{EntityName}Controller'),
```

## Step 6: Register Routes

Edit `src/presentation/routes/index.ts`:

```typescript
import { Router } from 'express';
import authRoutes from '../../modules/auth/presentation/routes/auth.routes';
import userRoutes from '../../modules/user/presentation/routes/user.routes';
import {module-name}Routes from '../../modules/{module-name}/presentation/routes/{moduleName}.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/{module-name}s', {module-name}Routes);

export default router;
```

## Step 7: Prisma Model (if needed)

Add to `prisma/schema.prisma`:

```prisma
model {EntityName} {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("{entity_name}s")
}
```

Run:

```bash
npm run prisma:push
npm run prisma:generate
```

## Testing

Create test files in `tests/unit/` or `tests/integration/`:

```typescript
// tests/unit/services/{EntityName}Service.test.ts
describe("{EntityName}Service", () => {
  it("should create a new entity", async () => {
    // Test implementation
  });
});
```

Run tests:

```bash
jest tests/unit/services/{EntityName}Service.test.ts
```

## Checklist

- [ ] Create module directory structure
- [ ] Create entity in domain/entities
- [ ] Create repository interface in domain/repositories
- [ ] Create Zod schemas in application/schemas (export inferred types)
- [ ] Create service in application/services with @injectable()
- [ ] Create repository in infrastructure/repositories with @injectable()
- [ ] Create controller in presentation/controllers with @injectable()
- [ ] Create routes in presentation/routes
- [ ] Register in DI container (container.ts and types.ts)
- [ ] Register routes in src/presentation/routes/index.ts
- [ ] Add Prisma model (if needed)
- [ ] Run Prisma migrations
- [ ] Write tests
- [ ] Test endpoints

## Important Notes

1. **Use InversifyJS**: All services, controllers, and repositories must use `@injectable()` decorator
2. **No Manual DTOs**: Use Zod schemas with inferred types (`z.infer<typeof schema>`)
3. **Error Handling**: Throw custom errors from services (NotFoundError, ConflictError, etc.)
4. **Async Handler**: Wrap all controller methods with `asyncHandler`
5. **Validation**: Use `validate(schema)` middleware for request validation
6. **Naming Conventions**: Follow naming conventions from [NAMING_CONVENTIONS.md](src/modules/NAMING_CONVENTIONS.md)

## For More Information

- [Architecture Documentation](src/modules/ARCHITECTURE.md) - Detailed architecture guide
- [Naming Conventions](src/modules/NAMING_CONVENTIONS.md) - Naming conventions
- [Modular Architecture](MODULAR_ARCHITECTURE.md) - Overview of modular architecture
- [Agent Guidelines](AGENTS.md) - Guidelines for agentic coding
