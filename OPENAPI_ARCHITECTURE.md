# OpenAPI Documentation Architecture

This implementation uses a hybrid approach for OpenAPI documentation with Zod, combining **Zod Schema Extensions** with **Feature-based Registry**.

## Architecture

```
src/
├── modules/                    # Feature modules (each has its own schemas)
│   ├── auth/
│   │   └── application/
│   │       └── schemas/
│   │           └── auth.schema.ts
│   ├── user/
│   │   └── application/
│   │       └── schemas/
│   │           └── user.schema.ts
│   ├── animal/
│   │   └── application/
│   │       └── schemas/
│   │           └── animal.schema.ts
│   └── ... (other modules)
└── infrastructure/
    └── openapi/
        ├── index.ts           # Main orchestrator
        └── features/          # Route definitions by module
            ├── auth.openapi.ts
            ├── user.openapi.ts
            ├── animal.openapi.ts
            └── ... (other modules)
```

## Principles Applied

1. **Single Source of Truth**: Zod schemas are the only source of truth for validation and documentation
2. **Separation of Concerns**: Field metadata in schemas, routes in feature modules
3. **Open/Closed Principle**: Add new features without modifying existing code
4. **Modular Clean Architecture**: Infrastructure separated from business logic
5. **Colocation**: OpenAPI definitions located near their module schemas

## Adding New Features

### 1. Create Zod Schemas

Create schema in `src/modules/{module-name}/application/schemas/{moduleName}.schema.ts`:

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createProductSchema = z
  .object({
    name: z.string().min(1).describe("Nombre del producto"),
    price: z.number().positive().describe("Precio del producto"),
  })
  .openapi({
    example: { name: "Producto A", price: 99.99 },
  });

export const productResponseSchema = z
  .object({
    id: z.string().uuid().describe("ID del producto"),
    name: z.string().describe("Nombre del producto"),
    price: z.number().describe("Precio del producto"),
    createdAt: z.date().describe("Fecha de creación"),
    updatedAt: z.date().describe("Fecha de actualización"),
  })
  .openapi({
    example: {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Producto A",
      price: 99.99,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
```

### 2. Register OpenAPI Routes

Create registration file in `src/infrastructure/openapi/features/{module-name}.openapi.ts`:

```typescript
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  createProductSchema,
  productResponseSchema,
} from "../../../modules/{module-name}/application/schemas/{moduleName}.schema";

export function registerProductRoutes(
  registry: OpenAPIRegistry,
  bearerAuth: { name: string },
) {
  registry.registerPath({
    method: "get",
    path: "/api/products",
    tags: ["Products"],
    summary: "Get all products",
    security: [{ [bearerAuth.name]: [] }],
    responses: {
      200: {
        description: "List of products",
        content: {
          "application/json": {
            schema: z.array(productResponseSchema),
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/products",
    tags: ["Products"],
    summary: "Create new product",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createProductSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Product created successfully",
        content: {
          "application/json": {
            schema: productResponseSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Get product by ID",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Product found",
        content: {
          "application/json": {
            schema: productResponseSchema,
          },
        },
      },
      404: {
        description: "Product not found",
      },
    },
  });

  registry.registerPath({
    method: "put",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Update product",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: createProductSchema.partial(),
          },
        },
      },
    },
    responses: {
      200: {
        description: "Product updated successfully",
        content: {
          "application/json": {
            schema: productResponseSchema,
          },
        },
      },
      404: {
        description: "Product not found",
      },
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/products/{id}",
    tags: ["Products"],
    summary: "Delete product",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      204: {
        description: "Product deleted successfully",
      },
      404: {
        description: "Product not found",
      },
    },
  });
}
```

### 3. Import in Main OpenAPI File

Import in `src/infrastructure/openapi/index.ts`:

```typescript
import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import express from "express";
import { registerAuthRoutes } from "./features/auth.openapi";
import { registerUserRoutes } from "./features/user.openapi";
import { registerAnimalRoutes } from "./features/animal.openapi";
import { registerBreedingRoutes } from "./features/breeding.openapi";
import { registerHealthRoutes } from "./features/health.openapi";
import { registerProductionRoutes } from "./features/production.openapi";
import { registerProductRoutes } from "./features/product.openapi"; // New

extendZodWithOpenApi(z);

export function generateOpenApiSpec() {
  const registry = new OpenAPIRegistry();

  // Register common components
  const bearerAuth = registry.registerComponent(
    "securitySchemes",
    "bearerAuth",
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  );

  // Register error response schema
  registry.register(
    "Error",
    z.object({
      error: z.string().describe("Error message"),
      code: z.string().describe("Error code"),
      details: z
        .array(
          z.object({
            path: z.array(z.string()).describe("Field path"),
            message: z.string().describe("Validation message"),
          }),
        )
        .optional()
        .describe("Validation details"),
    }),
  );

  // Register routes for each module
  registerAuthRoutes(registry);
  registerUserRoutes(registry, bearerAuth);
  registerAnimalRoutes(registry, bearerAuth);
  registerBreedingRoutes(registry, bearerAuth);
  registerHealthRoutes(registry, bearerAuth);
  registerProductionRoutes(registry, bearerAuth);
  registerProductRoutes(registry, bearerAuth); // New

  // Generate OpenAPI spec
  return registry.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Ayllu Gen API",
      version: "1.0.0",
      description: "Backend API for Ayllu Gen with Modular Clean Architecture",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Animals", description: "Animal management" },
      { name: "Breeding", description: "Breeding records" },
      { name: "Health", description: "Health records" },
      { name: "Production", description: "Production records" },
      { name: "Products", description: "Product management" },
    ],
  });
}

export function setupSwagger(app: express.Application) {
  const spec = generateOpenApiSpec();

  app.use("/api-docs", (req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    res.send(spec);
  });
}
```

## Key Features

### 1. Schema-Driven Documentation

All documentation is derived from Zod schemas, ensuring consistency:

```typescript
export const createProductSchema = z
  .object({
    name: z.string().min(1).describe("Nombre del producto"),
    price: z.number().positive().describe("Precio del producto"),
  })
  .openapi({
    example: { name: "Producto A", price: 99.99 },
  });
```

### 2. Feature-Based Registration

Each module registers its own OpenAPI routes:

```typescript
export function registerProductRoutes(
  registry: OpenAPIRegistry,
  bearerAuth: { name: string },
) {
  // Register all product routes here
}
```

### 3. Centralized Orchestration

Main OpenAPI file coordinates all modules:

```typescript
export function generateOpenApiSpec() {
  const registry = new OpenAPIRegistry();
  registerAuthRoutes(registry);
  registerUserRoutes(registry, bearerAuth);
  registerProductRoutes(registry, bearerAuth);
  return registry.generateDocument({ ... });
}
```

## Benefits

- ✅ **Scalable**: Each module is independent and self-contained
- ✅ **Maintainable**: Easy to find and modify routes by module
- ✅ **Type-safe**: Everything inferred from Zod schemas
- ✅ **Clean Architecture compliant**: Separation of layers respected
- ✅ **Developer-friendly**: Colocation and clear organization
- ✅ **Single Source of Truth**: Schemas drive validation and documentation
- ✅ **Modular**: New features added without modifying existing code

## Best Practices

1. **Always add `.describe()`** to schema fields for documentation
2. **Use `.openapi()` with `.example()`** for request/response examples
3. **Register all HTTP methods** (GET, POST, PUT, DELETE) for completeness
4. **Include error responses** for proper API documentation
5. **Group by tags** according to module/domain boundaries
6. **Use security schemas** consistently across authenticated endpoints

## Accessing Documentation

Once the server is running, access the OpenAPI spec at:

- OpenAPI JSON spec: `http://localhost:3000/api-docs`
- Swagger UI (if configured): `http://localhost:3000/api-docs/swagger`

## For More Information

- [Modular Architecture](MODULAR_ARCHITECTURE.md) - Architecture overview
- [Creating New Modules](NEW_MODULE_GUIDE.md) - Module creation guide
- [Architecture Documentation](src/modules/ARCHITECTURE.md) - Detailed docs
- [Agent Guidelines](AGENTS.md) - Guidelines for agentic coding
