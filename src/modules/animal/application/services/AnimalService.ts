import { injectable, inject } from "inversify";
import { IAnimalRepository } from "../../domain/repositories/IAnimalRepository";
import { TYPES } from "../../../../shared/di/types";
import {
  AnimalCreateInput,
  AnimalQueryInput,
  AnimalUpdateInput,
} from "../schemas/animal.schema";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/AppError";
import { AnimalCreateDTO } from "../../domain/entities/Animal";

export type AnimalResponse = {
  id: string;
  crotal: string;
  sex: string;
  species: string;
  birthDate: string | null;
  isFounder: boolean;
  fatherId: string | null;
  motherId: string | null;
  father?: any;
  mother?: any;
  children?: any[];
  userId: string;
  syncStatus: string;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

@injectable()
export class AnimalService {
  constructor(
    @inject(TYPES.IAnimalRepository)
    private animalRepository: IAnimalRepository,
  ) {}

  async create(
    userId: string,
    data: AnimalCreateInput,
  ): Promise<AnimalResponse> {
    const createData: AnimalCreateDTO = {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      userId,
    };
    const existing = await this.animalRepository.findByCrotal(
      data.crotal,
      userId,
    );
    if (existing) {
      throw new ConflictError("El crotal ya está en uso");
    }
    if (data.fatherId) {
      const existingFather = await this.animalRepository.findById(
        data.fatherId,
      );
      if (!existingFather) {
        throw new NotFoundError("Animal padre no encontrado");
      }
    }
    if (data.motherId) {
      const existingMother = await this.animalRepository.findById(
        data.motherId,
      );
      if (!existingMother) {
        throw new NotFoundError("Animal madre no encontrado");
      }
    }
    const animal = await this.animalRepository.create(createData);
    return this.mapToResponse(animal);
  }

  async update(
    id: string,
    userId: string,
    data: AnimalUpdateInput,
  ): Promise<AnimalResponse> {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new NotFoundError("Animal no encontrado");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "No tienes permiso para actualizar este animal",
      );
    }
    const updateData = {
      ...data,
      birthDate: animal.birthDate ? new Date(animal.birthDate) : undefined,
    } as any;

    const updated = await this.animalRepository.update(id, updateData);

    return this.mapToResponse(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new NotFoundError("Animal not found");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to delete this animal",
      );
    }

    await this.animalRepository.delete(id);
  }

  async getAnimal(id: string, userId: string): Promise<AnimalResponse> {
    const animal = await this.animalRepository.findById(id);
    if (!animal) {
      throw new NotFoundError("Animal not found");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to view this animal",
      );
    }

    return this.mapToResponse(animal);
  }

  async getAll(
    userId: string,
    query: AnimalQueryInput,
  ): Promise<{ animals: AnimalResponse[]; total: number }> {
    const { species, sex, isFounder, search, limit, offset } = query;

    let animals = await this.animalRepository.findAllByUserId(userId);

    if (species) {
      animals = animals.filter((a) => a.species === species);
    }

    if (sex) {
      animals = animals.filter((a) => a.sex === sex);
    }

    if (typeof isFounder === "boolean") {
      animals = animals.filter((a) => a.isFounder === isFounder);
    }

    if (search) {
      animals = animals.filter((a) =>
        a.crotal.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const total = animals.length;
    const paginated = animals.slice(offset, offset + limit);

    return { animals: paginated.map((a) => this.mapToResponse(a)), total };
  }

  async getPedigree(
    id: string,
    userId: string,
  ): Promise<AnimalResponse | null> {
    const animal = await this.animalRepository.findPedigree(id);
    if (!animal) {
      throw new NotFoundError("Animal not found");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to view this pedigree",
      );
    }

    return this.mapToResponse(animal);
  }

  async getFounders(userId: string): Promise<AnimalResponse[]> {
    const founders = await this.animalRepository.findFounders(userId);
    return founders.map(this.mapToResponse);
  }

  async getMales(userId: string): Promise<AnimalResponse[]> {
    const males = await this.animalRepository.findBySex(userId, "MALE");
    return males.map(this.mapToResponse);
  }

  async getFemales(userId: string): Promise<AnimalResponse[]> {
    const females = await this.animalRepository.findBySex(userId, "FEMALE");
    return females.map(this.mapToResponse);
  }

  private mapToResponse(animal: any): AnimalResponse {
    return {
      id: animal.id,
      crotal: animal.crotal,
      sex: animal.sex,
      species: animal.species,
      birthDate: animal.birthDate?.toISOString() || null,
      isFounder: animal.isFounder,
      fatherId: animal.fatherId || null,
      motherId: animal.motherId || null,
      father: animal.father ? this.mapToResponse(animal.father) : undefined,
      mother: animal.mother ? this.mapToResponse(animal.mother) : undefined,
      children: animal.children?.map((c: any) => this.mapToResponse(c)) || [],
      userId: animal.userId,
      syncStatus: animal.syncStatus,
      syncVersion: animal.syncVersion,
      createdAt: animal.createdAt.toISOString(),
      updatedAt: animal.updatedAt.toISOString(),
      deletedAt: animal.deletedAt?.toISOString() || null,
    };
  }
}
