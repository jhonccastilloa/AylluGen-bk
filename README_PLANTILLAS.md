# 🎉 Modular Clean Architecture - Templates and Guidelines

## 📋 Overview

This document provides templates and guidelines for creating new modules in the Ayllu Gen Backend using the **Modular Clean Architecture**.

### 📁 Current Modules

- **user** - User management
- **auth** - Authentication (register, login, refresh, logout)
- **animal** - Animal management
- **breeding** - Breeding records
- **health** - Health records
- **production** - Production records
- **sync** - Synchronization

### 📚 Documentation Files

- `AGENTS.md` - Guidelines for agentic coding
- `README.md` - Project overview and setup
- `MODULAR_ARCHITECTURE.md` - Complete modular architecture guide
- `NEW_MODULE_GUIDE.md` - Step-by-step module creation guide
- `OPENAPI_ARCHITECTURE.md` - OpenAPI documentation architecture
- `IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `src/modules/ARCHITECTURE.md` - Detailed architecture documentation
- `src/modules/NAMING_CONVENTIONS.md` - Naming conventions guide

---

## 🎯 Module Template Structure

Each module follows this exact structure:

```
src/modules/{module-name}/
├── domain/
│   ├── entities/
│   │   └── {EntityName}.ts
│   └── repositories/
│       └── I{EntityName}Repository.ts
├── application/
│   ├── services/
│   │   └── {ModuleName}Service.ts
│   └── schemas/
│       └── {moduleName}.schema.ts
├── infrastructure/
│   └── repositories/
│       └── {EntityName}Repository.ts
└── presentation/
    ├── controllers/
    │   └── {ModuleName}Controller.ts
    └── routes/
        └── {moduleName}.routes.ts
```

---

## 🚀 Quick Start - Create a New Module

### Step 1: Create Directory Structure

```bash
mkdir -p src/modules/{module-name}/domain/{entities,repositories}
mkdir -p src/modules/{module-name}/application/{services,schemas}
mkdir -p src/modules/{module-name}/infrastructure/repositories
mkdir -p src/modules/{module-name}/presentation/{controllers,routes}
```

### Step 2: Domain Layer

Create entity and repository interface.

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

### Step 3: Application Layer

Create Zod schemas and service.

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

**File:** `src/modules/{module-name}/application/services/{ModuleName}Service.ts`

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

### Step 4: Infrastructure Layer

Create repository implementation.

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

### Step 5: Presentation Layer

Create controller and routes.

**File:** `src/modules/{module-name}/presentation/controllers/{ModuleName}Controller.ts`

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

### Step 6: Register in DI Container

Add to `src/shared/di/types.ts`:

```typescript
{EntityName}Service: Symbol.for('{EntityName}Service'),
{EntityName}Controller: Symbol.for('{EntityName}Controller'),
```

Add to `src/shared/di/container.ts`:

```typescript
container.bind<I{EntityName}Repository>(TYPE_I{EntityName}Repository).to({EntityName}Repository);
container.bind<{EntityName}Service>(TYPES.{EntityName}Service).to({EntityName}Service);
container.bind<{EntityName}Controller>(TYPES.{EntityName}Controller).to({EntityName}Controller);
```

### Step 7: Register Routes

Add to `src/presentation/routes/index.ts`:

```typescript
import {module-name}Routes from '../../modules/{module-name}/presentation/routes/{moduleName}.routes';

router.use('/{module-name}s', {module-name}Routes);
```

### Step 8: Add Prisma Model (if needed)

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

---

## 📚 Reference Resources

### Internal Documentation

- [AGENTS.md](../AGENTS.md) - Guidelines for agentic coding
- [README.md](../README.md) - Project overview and setup
- [MODULAR_ARCHITECTURE.md](../MODULAR_ARCHITECTURE.md) - Architecture overview
- [NEW_MODULE_GUIDE.md](../NEW_MODULE_GUIDE.md) - Step-by-step guide
- [OPENAPI_ARCHITECTURE.md](../OPENAPI_ARCHITECTURE.md) - Documentation architecture
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md) - Naming conventions

### External Documentation

- [Inversify](https://inversify.io/) - Dependency Injection Container
- [Zod](https://zod.dev/) - Schema validation
- [Prisma](https://www.prisma.io/) - ORM
- [TypeScript](https://www.typescriptlang.org/) - Language
- [Express](https://expressjs.com/) - Web framework

---

## ✅ Checklist

Before creating a new module:

- [ ] Create directory structure
- [ ] Create entity in domain/entities
- [ ] Create repository interface in domain/repositories
- [ ] Create Zod schemas in application/schemas (export inferred types)
- [ ] Create service in application/services with @injectable()
- [ ] Create repository in infrastructure/repositories with @injectable()
- [ ] Create controller in presentation/controllers with @injectable()
- [ ] Create routes in presentation/routes
- [ ] Register in DI container (types.ts and container.ts)
- [ ] Register routes in src/presentation/routes/index.ts
- [ ] Add Prisma model (if needed)
- [ ] Run Prisma migrations
- [ ] Write tests
- [ ] Test endpoints

---

## 🚀 Current Status

- ✅ Modular clean architecture implemented
- ✅ 7 modules created (user, auth, animal, breeding, health, production, sync)
- ✅ Dependency Injection configured with InversifyJS
- ✅ Zod schemas for validation
- ✅ OpenAPI documentation for all endpoints
- ✅ Error handling with custom error classes
- ✅ Winston logging configured
- ✅ System ready for scaling to 50+ routes

---

## 💡 Recommendations

### For Current Project (Medium Scale)

**Maintain manual approach with `container.get<TYPE>()`** - Simplicity and flexibility

### For Future Expansion (Large Scale)

**Consider automation tools** when you have 30+ modules:

- CLI tools for scaffolding new modules
- Code generators for repetitive patterns
- Automated testing templates

---

## 📖 Next Steps

- Review existing modules (user, auth, animal, breeding, health, production, sync)
- Follow naming conventions from NAMING_CONVENTIONS.md
- Use NEW_MODULE_GUIDE.md for detailed instructions
- Check AGENTS.md for agentic coding guidelines

**Need help?** Refer to the documentation files listed above for detailed information on each aspect of the architecture.
