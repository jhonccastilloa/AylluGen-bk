# Arquitectura de Módulos - Guía Completa

## 📋 Contenido

- [Estructura Estándar](#estructura-estándar-de-un-módulo)
- [Convenciones de Nombres](#convenciones-de-nombres)
- [Responsabilidades por Capa](#responsabilidades-por-capa)
- [Flujo de Datos](#flujo-de-datos)
- [Patrones de Diseño](#patrones-de-diseño)
- [Mejores Prácticas](#mejores-prácticas)

---

## 📐 Estructura Estándar de un Módulo

Cada módulo debe seguir esta estructura exacta:

```
src/modules/{module-name}/
├── domain/
│   ├── entities/          ← Entidades del dominio (puro datos)
│   │   └── {EntityName}.ts
│   └── repositories/      ← Interfaces de repositorios
│       └── I{EntityName}Repository.ts
├── application/
│   ├── services/          ← Lógica de negocio
│   │   └── {ModuleName}Service.ts
│   └── schemas/           ← Zod schemas (DTOs)
│       ├── {moduleName}.schema.ts
│       └── {moduleName}.filter.schema.ts (opcional)
├── infrastructure/
│   └── repositories/      ← Implementaciones técnicas
│       └── {EntityName}Repository.ts
└── presentation/
    ├── controllers/
    │   └── {ModuleName}Controller.ts  ← Controladores Express
    └── routes/
        └── {moduleName}.routes.ts    ← Definición de rutas
```

---

## 🎯 Convenciones de Nombres

### Nombres de Archivos

| Tipo          | Formato                        | Ejemplo                 | Regla                 |
| ------------- | ------------------------------ | ----------------------- | --------------------- |
| Entidad       | `{EntityName}.ts`              | `Order.ts`, `User.ts`   | PascalCase            |
| Interfaz Repo | `I{EntityName}Repository.ts`   | `IOrderRepository.ts`   | + prefijo "I"         |
| Repo Impl     | `{EntityName}Repository.ts`    | `OrderRepository.ts`    | PascalCase            |
| Servicio      | `{ModuleName}Service.ts`       | `OrderService.ts`       | + sufijo "Service"    |
| Schema        | `{moduleName}.schema.ts`       | `order.schema.ts`       | kebab-case            |
| Controller    | `{ModuleName}Controller.ts`    | `OrderController.ts`    | + sufijo "Controller" |
| Rutas         | `{moduleName}.routes.ts`       | `order.routes.ts`       | kebab-case            |
| Símbolo TYPE  | `TYPE_I{EntityName}Repository` | `TYPE_IOrderRepository` | SCREAMING_SNAKE_CASE  |

### Nombres de Métodos

```typescript
// Métodos CRUD
✅ findById()        - Buscar por ID
✅ findAll()         - Listar todos (con filtros opcionales)
✅ create()           - Crear nuevo registro
✅ update()           - Actualizar existente
✅ delete()           - Eliminar registro

// Métodos de búsqueda
✅ findBy{Field}() - Buscar por campo único
✅ findActive()   - Buscar registros activos

// Métodos de negocio
✅ processPayment() - Procesar pago
✅ generateReport() - Generar reporte
✅ sendNotification() - Enviar notificación
```

---

## 🔧 Responsabilidades por Capa

### 1. Domain Layer

**Responsabilidad:** Definir entidades y reglas de negocio

```typescript
export interface User {
  id: string;
  dni: string;
  password: string;
  createdAt: Date;
  updatedAT: Date;
}

export const VALID_DNI_REGEX = /^\d{8}$/;
```

**NO hacer en Domain Layer:**

- ❌ Lógica de aplicación
- ❌ Acceso a base de datos
- ❌ Validación de entrada (es Application)
- ❌ Integración con APIs externas (es Infrastructure)

---

### 2. Application Layer

**Responsabilidad:** Casos de uso y lógica de negocio

```typescript
@injectable()
export class UserService {
  constructor(
    @inject(TYPE_IUserRepository) private userRepository: IUserRepository
  ) {}

  async create(data: UserCreateInput): Promise<UserResponse> {
    const hashedPassword = await hashPassword(data.password);
    return this.userRepository.create({ ... });
  }
}
```

**Reglas:**

- ✅ Usar `transaction()` para operaciones atómicas
- ✅ Lanzar errores de dominio (ej: `ValidationError`)
- ✅ Usar mappers para conversión de entidades

---

### 3. Infrastructure Layer

**Responsabilidad:** Implementar acceso a datos y detalles técnicos

```typescript
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
    return await this.client.user.findUnique({ where: { id } });
  }
}
```

**Reglas:**

- ✅ Usar `setTransactionClient()` + `transaction()`
- ✅ No lógica de negocio (solo operaciones de datos)
- ✅ Manejar errores de base de datos con `AppError`

---

### 4. Presentation Layer

**Responsabilidad:** Manejo de HTTP y APIs

```typescript
@injectable()
export class OrderController {
  constructor(@inject(TYPES.OrderService) private orderService: OrderService) {}

  getAll = asyncHandler(async (req, res) => {
    const result = await this.orderService.findAll(req.query);
    res.status(200).json(result);
  });

  create = asyncHandler(async (req, res) => {
    const data = req.body;
    const result = await this.orderService.create(data);
    res.status(201).json(result);
  });
}
```

**Reglas:**

- ✅ Usar `asyncHandler()` wrapper
- ✅ Validar con `validate(schema)`
- ✅ Inyectar servicios con `@inject()`
- ✅ Usar códigos HTTP correctos (200, 201, 204, 400, 401, 404, 409)
- ✅ No lógica de negocio (delegar a servicios)

---

## 🔄 Flujo de Datos

```
Request → Validation Middleware → Controller → Service → Repository → Database
  ↓                      ↓           ↓         ↓            ↓         ↓
  DTO Body             Validación     Lógica     Query/CRUD    Persistencia
  ↓                      ↓           ↓         ↓            ↓
HTTP Response ←          ←           ←         ←            ←       Entity
```

**Validación:** Zod schemas en `application/schemas/`
**Lógica de Negocio:** Services en `application/services/`
**Acceso a Datos:** Repositories en `infrastructure/repositories/`

---

## 🎨 Patrones de Diseño

### Repository Pattern

```typescript
// Interfaz en Domain Layer
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(data: UserCreateInput): Promise<User>;
  // ...
}

// Implementación en Infrastructure Layer
@injectable()
export class UserRepository implements IUserRepository {
  // ...
}
```

### Service Pattern

```typescript
@injectable()
export class UserService {
  constructor(
    @inject(TYPE_IUserRepository) private userRepository: IUserRepository,
  ) {}

  // Lógica de negocio
  async create(data: UserCreateInput): Promise<UserResponse> {
    // ...
  }
}
```

### Factory Pattern (opcional)

```typescript
// Para crear entidades complejas
export class OrderFactory {
  static fromDTO(dto: OrderCreateInput): Order {
    return {
      id: generateUUID(),
      status: "PENDING",
      // ...
    };
  }
}
```

---

## 📝 Mejores Prácticas

### 1. Inyección de Dependencias

```typescript
// ✅ CORRECTO
@injectable()
export class AuthService {
  constructor(
    @inject(TYPE_IUserRepository) private userRepository: IUserRepository,
  ) {}
}

// ❌ INCORRECTO
export class AuthService {
  private userRepository = new UserRepository();
}
```

### 2. Manejo de Errores

```typescript
// ✅ CORRECTO
throw new NotFoundError("Usuario no encontrado");

// ❌ INCORRECTO
throw new Error("Usuario no encontrado");
res.status(404).send("No encontrado");
```

### 3. Transacciones

```typescript
// ✅ CORRECTO
await transaction(async (tx) => {
  this.repository.setTransactionClient(tx);
  await this.repository.create(data);
  await this.otherRepository.create(otherData);
  this.repository.setTransactionClient(null);
});

// ❌ INCORRECTO
await this.repository.create(data);
await this.otherRepository.create(otherData);
```

### 4. Validación con Zod

```typescript
// ✅ CORRECTO
export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .describe("Login credentials");

// ❌ INCORRECTO (sin describe)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### 5. Mappers

```typescript
// ✅ CORRECTO
static toResponse(entity: User): UserResponse {
  return {
    id: entity.id,
    // ...
  };
}

// ❌ INCORRECTO
const toResponse = (entity) => ({
  id: entity.id,
  // ...
});
```

---

## 🚀 Checklist para Código de Producción

Antes de hacer commit, verificar:

- [ ] No hay código duplicado (DRY principle)
- [ ] No hay console.log() o debugger
- [ ] No hay passwords en logs (sanitizar)
- [ ] Todas las rutas tienen rate limiting
- [ ] Todos los controllers usan asyncHandler
- [ ] Todos los servicios tienen @injectable()
- [ ] Todos los controladores usan @injectable()
- [ ] Las dependencias se inyectan con @inject(TYPES.Xxx)
- ] No hay métodos síncronos bloqueantes
- [ ] Los errores se lanzan con clases personalizadas
- [ ] Los DTOs tienen .describe() y .openapi()
- ] Los nombres siguen convenciones (camelCase, PascalCase, kebab-case)

---

## 📚 Recursos Adicionales

### Documentación

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/clean-code/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DDD_Evolved)
- [Inversify Docs](https://inversify.io/)

### Herramientas

- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [Prisma](https://www.prisma.io/)
- [Express](https://expressjs.com/)
- [Jest](https://jestjs.io/)
