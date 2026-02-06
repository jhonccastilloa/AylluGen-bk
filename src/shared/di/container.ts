import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";

// Importar repositorios existentes
import { UserRepository } from "../../modules/user/infrastructure/repositories/UserRepository";
import { RefreshTokenRepository } from "../../modules/auth/infrastructure/repositories/RefreshTokenRepository";

// Importar repositorios nuevos
import { AnimalRepository } from "../../modules/animal/infrastructure/repositories/AnimalRepository";
import { BreedingRepository } from "../../modules/breeding/infrastructure/repositories/BreedingRepository";
import { HealthRecordRepository } from "../../modules/health/infrastructure/repositories/HealthRecordRepository";
import { ProductionRecordRepository } from "../../modules/production/infrastructure/repositories/ProductionRecordRepository";
import { SyncRepository } from "../../modules/sync/infrastructure/repositories/SyncRepository";

// Importar servicios existentes
import { AuthService } from "../../modules/auth/application/services/AuthService";
import { UserService } from "../../modules/user/application/services/UserService";

// Importar servicios nuevos
import { AnimalService } from "../../modules/animal/application/services/AnimalService";
import { BreedingService } from "../../modules/breeding/application/services/BreedingService";
import { HealthRecordService } from "../../modules/health/application/services/HealthRecordService";
import { ProductionRecordService } from "../../modules/production/application/services/ProductionRecordService";
import { SyncService } from "../../modules/sync/application/services/SyncService";

// Importar controladores existentes
import { AuthController } from "../../modules/auth/presentation/controllers/AuthController";
import { UserController } from "../../modules/user/presentation/controllers/UserController";

// Importar controladores nuevos
import { AnimalController } from "../../modules/animal/presentation/controllers/AnimalController";
import { BreedingController } from "../../modules/breeding/presentation/controllers/BreedingController";
import { HealthRecordController } from "../../modules/health/presentation/controllers/HealthRecordController";
import { ProductionRecordController } from "../../modules/production/presentation/controllers/ProductionRecordController";
import { SyncController } from "../../modules/sync/presentation/controllers/SyncController";

// Crear contenedor con alcance Singleton
const container = new Container({ defaultScope: "Singleton" });

// ============ BINDEOS DE REPOSITORIOS ============
container.bind<UserRepository>(TYPES.IUserRepository).to(UserRepository);
container
  .bind<RefreshTokenRepository>(TYPES.IRefreshTokenRepository)
  .to(RefreshTokenRepository);
container.bind<AnimalRepository>(TYPES.IAnimalRepository).to(AnimalRepository);
container
  .bind<BreedingRepository>(TYPES.IBreedingRepository)
  .to(BreedingRepository);
container
  .bind<HealthRecordRepository>(TYPES.IHealthRecordRepository)
  .to(HealthRecordRepository);
container
  .bind<ProductionRecordRepository>(TYPES.IProductionRecordRepository)
  .to(ProductionRecordRepository);
container.bind<SyncRepository>(TYPES.ISyncRepository).to(SyncRepository);

// ============ BINDEOS DE SERVICIOS ============
container.bind<AuthService>(TYPES.AuthService).to(AuthService);
container.bind<UserService>(TYPES.UserService).to(UserService);
container.bind<AnimalService>(TYPES.AnimalService).to(AnimalService);
container.bind<BreedingService>(TYPES.BreedingService).to(BreedingService);
container
  .bind<HealthRecordService>(TYPES.HealthRecordService)
  .to(HealthRecordService);
container
  .bind<ProductionRecordService>(TYPES.ProductionRecordService)
  .to(ProductionRecordService);
container.bind<SyncService>(TYPES.SyncService).to(SyncService);

// ============ BINDEOS DE CONTROLADORES ============
container.bind<AuthController>(TYPES.AuthController).to(AuthController);
container.bind<UserController>(TYPES.UserController).to(UserController);
container.bind<AnimalController>(TYPES.AnimalController).to(AnimalController);
container
  .bind<BreedingController>(TYPES.BreedingController)
  .to(BreedingController);
container
  .bind<HealthRecordController>(TYPES.HealthRecordController)
  .to(HealthRecordController);
container
  .bind<ProductionRecordController>(TYPES.ProductionRecordController)
  .to(ProductionRecordController);
container.bind<SyncController>(TYPES.SyncController).to(SyncController);

export { container, TYPES };
