# Convenciones de Nomenclatura - Guía Oficial

Esta guía define las convenciones de nomenclatura utilizadas en todo el proyecto para mantener consistencia y facilitar la colaboración entre desarrolladores.

---

## 📋 Tabla de Contenido

- [Convenciones de Archivos](#convenciones-de-archivos)
- [Convenciones de Directorios](#convenciones-de-directorios)
- [Convenciones de Código - General](#convenciones-de-código-general)
- [Convenciones por Capa](#convenciones-por-capa)
- [Ejemplos Complejos](#ejemplos-completos)
- [Palabras Reservadas](#palabras-reservadas)

---

## 📁 Convenciones de Archivos

### 1.1 Extensiones

| Tipo          | Extensión                           | Ejemplo               |
| ------------- | ----------------------------------- | --------------------- |
| TypeScript    | `.ts`                               | `UserService.ts`      |
| Interfaces    | `.ts` (en mismo archivo que export) | `IUserRepository.ts`  |
| Tests         | `.test.ts`                          | `UserService.test.ts` |
| Documentación | `.md`                               | `ARCHITECTURE.md`     |
| Configuración | `.config.ts`, `.json`               | `tsconfig.json`       |

### 1.2 Formato de Nombres

- **kebab-case** para directorios y archivos de código
- **PascalCase** para clases e interfaces
- **camelCase** para variables, métodos y propiedades
- **SCREAMING_SNAKE_CASE** para constantes y símbolos

**Ejemplos:**

```
✅ Directorios:  user-management, order-processing
✅ Archivos:  user.service.ts, auth.controller.ts
✅ Clases:  UserService, AuthController
✅ Métodos:  findById, createUser
✅ Variables:  userId, isAuthenticated
✅ Constantes:  API_BASE_URL, MAX_RETRY_ATTEMPTS
```

---

## 📂 Convenciones de Directorios

### 2.1 Estructura de Directorios

```
src/
├── modules/              ← Todos los módulos de negocio
│   ├── {module-name}/
│   │   ├── domain/         ← Lógica de dominio pura
│   │   ├── application/    ← Casos de uso y lógica de negocio
│   │   ├── infrastructure/ ← Implementaciones técnicas
│   │   └── presentation/   ← APIs y controladores
├── shared/              ← Código compartido entre módulos
│   ├── di/              ← Dependency Injection
│   ├── mappers/          ← Conversión de entidades
│   ├── utils/            ← Utilidades genéricas
│   ├── errors/           ← Errores personalizados
│   ├── constants/         ← Constantes del sistema
│   └── logging/          ← Logging con Winston
└── infrastructure/        ← Infraestructura técnica
    ├── database/         ← Prisma cliente
    └── openapi/          ← Documentación API
```

### 2.2 Nombres de Directorios

| Tipo                 | Formato             | Ejemplo                                         |
| -------------------- | ------------------- | ----------------------------------------------- |
| Módulo               | kebab-case          | `user-management`, `order-processing`           |
| Domain layer         | `{domain}/`         | `domain/entities/`, `domain/repositories/`      |
| Application layer    | `{application}/`    | `application/services/`, `application/schemas/` |
| Infrastructure layer | `{infrastructure}/` | `infrastructure/repositories/`                  |
| Presentation layer   | `{presentation}/`   | `presentation/controllers/`                     |

---

## 🔤 Convenciones de Código - General

### 3.1 Case Styles

| Estilo                   | Uso                             | Ejemplo                                      |
| ------------------------ | ------------------------------- | -------------------------------------------- |
| **PascalCase**           | Clases, Interfaces, Types       | `User`, `IUserRepository`, `CreateUserInput` |
| **camelCase**            | Variables, Métodos, Propiedades | `userId`, `getUserById()`, `createdAt`       |
| **SCREAMING_SNAKE_CASE** | Constantes, Símbolos            | `API_BASE_URL`, `TYPE_IUserRepository`       |
| **kebab-case**           | Directorios, Archivos           | `user-service.ts`, `health-check/`           |

### 3.2 Convenciones Específicas

#### Nombres de Variables

```
✅ userId           ← ID de usuario
✅ userRepository   ← Repositorio inyectado
✅ MAX_RETRY_COUNT ← Constante numérica
✅ isAuthenticated  ← Booleano
✅ ERROR_MESSAGES    ← Objeto de mensajes
```

#### Nombres de Métodos

```
✅ Métodos de consulta:    getUserById(), findByEmail()
✅ Métodos de acción:    createUser(), updateUser(), deleteUser()
✅ Métodos booleanos:   isValid(), hasAccess(), canEdit()
✅ Métodos de utilidad: sanitizeInput(), mapToResponse()
```

#### Nombres de Interfaces

```
✅ Interfaces de repositorio:    IUserRepository, IProductRepository
✅ Interfaces de servicio:     IAuthService (opcional, solo repositorio)
✅ Interfaces DTO:             CreateUserInput, UpdateUserInput, UserResponse
✅ Interfaces controller:       (usualmente no necesarias)
```

#### Prefix/Suffix

| Sufijo              | Uso                             | Ejemplo           |
| ------------------- | ------------------------------- | ----------------- |
| `I` prefijo         | Interfaces (solo repositorio)   | `IUserRepository` |
| `Service` sufijo    | Servicios de aplicación         | `UserService`     |
| `Controller` sufijo | Controladores                   | `UserController`  |
| `Repository` sufijo | Implementaciones de repositorio | `UserRepository`  |
| `Schema` sufijo     | Schemas Zod                     | `userSchema`      |
| `Mapper` sufijo     | Mappers de entidades            | `UserMapper`      |

---

## 🏗 Convenciones por Capa

### 4.1 Domain Layer

#### Entidades

```typescript
// ✅ CORRECTO
export interface User {
  id: string;
  dni: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  dni: string;
  password: string;
}

export interface UserUpdateInput {
  password?: string;
}
```

#### Interfaces de Repositorio

```typescript
// ✅ CORRECTO
export const TYPE_IUserRepository = Symbol("IUserRepository");

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByDni(dni: string): Promise<User | null>;
  create(data: UserCreateInput): Promise<User>;
  update(id: string, data: UserUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(filters?: UserFilters): Promise<User[]>;
}
```

### 4.2 Application Layer

#### Schemas (Zod DTOs)

```typescript
// ✅ CORRECTO
export const userCreateSchema = z.object({
  dni: z.string().length(8),
  password: z.string().min(8),
});

export const userUpdateSchema = z.object({
  password: z.string().min(8).optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  dni: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
```

#### Servicios

```typescript
// ✅ CORRECTO
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

### 4.3 Infrastructure Layer

#### Implementaciones de Repositorio

```typescript
// ✅ CORRECTO
@injectable()
export class UserRepository implements IUserRepository {
  private transactionClient: PrismaTransaction | null = null;

  setTransactionClient(client: PrismaTransaction | null): void {
    this.transactionClient = client;
  }

  private get client() {
    return this.transactionClient || prisma;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.client.user.findUnique({
      where: { id },
    });
    return user;
  }
}
```

### 4.4 Presentation Layer

#### Controladores

```typescript
// ✅ CORRECTO
@injectable()
export class UserController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {}

  getAll = asyncHandler(async (req, res) => {
    const result = await this.userService.findAll(req.query);
    res.status(200).json(result);
  });

  getById = asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const result = await this.userService.findById(id);
    res.status(200).json(result);
  });
}
```

#### Rutas

```typescript
// ✅ CORRECTO
const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

// Rutas públicas
router.get("/", authLimiter, userController.getAll);
router.get("/:id", authLimiter, userController.getById);

// Rutas protegidas
router.post(
  "/",
  authMiddleware,
  authLimiter,
  validate(userCreateSchema),
  userController.create,
);
router.put(
  "/:id",
  authMiddleware,
  authLimiter,
  validate(userUpdateSchema),
  userController.update,
);
router.delete("/:id", authMiddleware, strictLimiter, userController.delete);

export default router;
```

---

## 📝 Ejemplos Completos

### 5.1 Módulo de Productos (Ejemplo Completo)

```
src/modules/product/
├── domain/
│   ├── entities/
│   │   └── Product.ts
│   └── repositories/
│       └── IProductRepository.ts
├── application/
│   ├── services/
│   │   └── ProductService.ts
│   └── schemas/
│       ├── product.schema.ts
│       └── product.filter.schema.ts
├── infrastructure/
│   └── repositories/
│       └── ProductRepository.ts
└── presentation/
    ├── controllers/
    │   └── ProductController.ts
    └── routes/
        └── product.routes.ts
```

#### Product Entity

```typescript
// src/modules/product/domain/entities/Product.ts
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCreateInput {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
}
```

#### Product Service

```typescript
// src/modules/product/application/services/ProductService.ts
import { injectable, inject } from "inversify";
import {
  IProductRepository,
  TYPE_IProductRepository,
} from "../../domain/repositories/IProductRepository";
import {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductFilters,
} from "../../domain/entities/Product";
import {
  ProductCreateInput as ProductCreateInputSchema,
  ProductUpdateInput as ProductUpdateInputSchema,
  ProductResponse,
} from "../schemas/product.schema";
import { ProductMapper } from "../../../../shared/mappers/ProductMapper";
import { NotFoundError } from "../../../../shared/errors/AppError";

@injectable()
export class ProductService {
  constructor(
    @inject(TYPE_IProductRepository)
    private productRepository: IProductRepository,
  ) {}

  async findAll(filters: ProductFilters): Promise<ProductResponse[]> {
    const where: any = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        where.price.lte = filters.maxPrice;
      }
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const products = await this.productRepository.findAll(where);
    return ProductMapper.toResponseList(products);
  }

  async findById(id: string): Promise<ProductResponse> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Producto no encontrado");
    }
    return ProductMapper.toResponse(product);
  }

  async create(data: ProductCreateInputSchema): Promise<ProductResponse> {
    const product = await this.productRepository.create(data);
    return ProductMapper.toResponse(product);
  }

  async update(
    id: string,
    data: ProductUpdateInputSchema,
  ): Promise<ProductResponse> {
    const updatedProduct = await this.productRepository.update(id, data);
    return ProductMapper.toResponse(updatedProduct);
  }

  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  async decreaseStock(id: string, quantity: number): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Producto no encontrado");
    }

    const newStock = Math.max(0, product.stock - quantity);
    await this.productRepository.update(id, { stock: newStock });
  }
}
```

---

## 🚫 Palabras Reservadas

**NO usar estas palabras como nombres de variables, métodos o clases:**

| Palabra    | Razón                                                              | Alternativa                                 |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `user`     | Confuso con entidad User                                           | `account`, `profile`, `member`              |
| `password` | En seguridad, usar diferentes nombres en contextos no-autenticados | `credential`, `secret`, `apiKey`            |
| `token`    | Demasiado genérico                                                 | `accessToken`, `refreshToken`, `sessionKey` |
| `list`     | Ambiguo                                                            | `array`, `collection`, `items`              |
| `data`     | Demasiado genérico                                                 | `payload`, `requestBody`, `queryParams`     |
| `object`   | Palabra reservada JS                                               | `entity`, `record`, `item`                  |
| `type`     | Conflicto con TypeScript                                           | `kind`, `category`, `variant`               |

---

## 📌 Cheat Sheet Rápido

| Situación                   | Convención               | Ejemplo                 |
| --------------------------- | ------------------------ | ----------------------- |
| Nueva entidad               | `{Name}.ts`              | `Order.ts`              |
| Nuevo repositorio interface | `I{Name}Repository.ts`   | `IOrderRepository.ts`   |
| Nuevo repositorio impl      | `{Name}Repository.ts`    | `OrderRepository.ts`    |
| Nuevo servicio              | `{Name}Service.ts`       | `OrderService.ts`       |
| Nuevo controlador           | `{Name}Controller.ts`    | `OrderController.ts`    |
| Nuevas rutas                | `{name}.routes.ts`       | `order.routes.ts`       |
| Nuevo schema                | `{name}.schema.ts`       | `order.schema.ts`       |
| Símbolo TYPE                | `TYPE_I{Name}Repository` | `TYPE_IOrderRepository` |
| Símbolo Service             | `TYPES.{Name}Service`    | `TYPES.OrderService`    |
| Símbolo Controller          | `TYPES.{Name}Controller` | `TYPES.OrderController` |

---

## ✅ Verificación de Convenciones

Usar este checklist antes de hacer commits:

- [ ] Todos los archivos están en **kebab-case**
- [ ] Las clases usan **PascalCase**
- [ ] Las variables usan **camelCase**
- [ ] Las constantes usan **SCREAMING_SNAKE_CASE**
- [ ] Los métodos usan **camelCase** con verbos descriptivos
- [ ] Los repositorios implementan `I{Name}Repository`
- [ ] Los servicios se decoran con `@injectable()`
- [ ] Los controladores se decoran con `@injectable()`
- [ ] Las dependencias se inyectan con `@inject(TYPES.Xxx)`
- [ ] Los mappers se llaman `Mapper.toResponse()`
- [ ] Las rutas exportan `export default router`
- [ ] Los schemas usan Zod con `.describe()` y `.openapi()`
