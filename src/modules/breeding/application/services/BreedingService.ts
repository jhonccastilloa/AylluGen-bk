import { injectable, inject } from "inversify";
import { IBreedingRepository } from "../../domain/repositories/IBreedingRepository";
import { IAnimalRepository } from "../../../animal/domain/repositories/IAnimalRepository";
import { TYPES } from "../../../../shared/di/types";
import { GeneticEngine } from "../../domain/services/GeneticEngine";
import {
  BreedingCreateInput,
  BreedingUpdateInput,
  BreedingMatchInput,
} from "../schemas/breeding.schema";
import { COICalculationResponse } from "../schemas/breeding.schema";
import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/AppError";

@injectable()
export class BreedingService {
  private geneticEngine: GeneticEngine;

  constructor(
    @inject(TYPES.IBreedingRepository)
    private breedingRepository: IBreedingRepository,
    @inject(TYPES.IAnimalRepository)
    private animalRepository: IAnimalRepository,
  ) {
    this.geneticEngine = new GeneticEngine();
  }

  async calculateCOI(
    userId: string,
    matchData: BreedingMatchInput,
  ): Promise<COICalculationResponse> {
    const male = await this.animalRepository.findById(matchData.maleId);
    const female = await this.animalRepository.findById(matchData.femaleId);

    if (!male) {
      throw new NotFoundError("Male animal not found");
    }

    if (!female) {
      throw new NotFoundError("Female animal not found");
    }

    if (male.userId !== userId || female.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to access these animals",
      );
    }

    const pedigree = await this.buildPedigree([male.id, female.id], 4);
    const result = this.geneticEngine.calculateCOI(male, female, pedigree);

    return {
      coi: result.coi,
      riskLevel: result.riskLevel,
      relationship: result.relationship,
      recommendation: this.geneticEngine.getRecommendation(
        result.coi,
        result.riskLevel,
      ),
    };
  }

  async create(userId: string, data: BreedingCreateInput): Promise<any> {
    const male = await this.animalRepository.findById(data.maleId);
    const female = await this.animalRepository.findById(data.femaleId);

    if (!male) {
      throw new NotFoundError("Male animal not found");
    }

    if (!female) {
      throw new NotFoundError("Female animal not found");
    }

    if (male.userId !== userId || female.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to access these animals",
      );
    }

    const breeding = await this.breedingRepository.create({
      ...data,
      userId,
      breedingDate: data.breedingDate ? new Date(data.breedingDate) : undefined,
    });

    return this.mapToResponse(breeding);
  }
  async getAll(userId: string): Promise<{ breedings: any[] }> {
    const breedings = await this.breedingRepository.findAllByUserId(userId);
    return { breedings: breedings.map((b) => this.mapToResponse(b)) };
  }
  async getById(id: string, userId: string): Promise<any> {
    const breeding = await this.breedingRepository.findById(id);
    if (!breeding) {
      throw new NotFoundError("Breeding not found");
    }

    if (breeding.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to view this breeding",
      );
    }

    return this.mapToResponse(breeding);
  }

  async updateBreeding(
    id: string,
    userId: string,
    data: BreedingUpdateInput,
  ): Promise<any> {
    const breeding = await this.breedingRepository.findById(id);
    if (!breeding) {
      throw new NotFoundError("Breeding not found");
    }

    if (breeding.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to update this breeding",
      );
    }

    const updateData: any = { ...data };
    if (data.breedingDate) {
      updateData.breedingDate = new Date(data.breedingDate);
    }

    const updated = await this.breedingRepository.update(id, updateData);

    return this.mapToResponse(updated);
  }

  async deleteBreeding(id: string, userId: string): Promise<void> {
    const breeding = await this.breedingRepository.findById(id);
    if (!breeding) {
      throw new NotFoundError("Breeding not found");
    }

    if (breeding.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to delete this breeding",
      );
    }

    await this.breedingRepository.delete(id);
  }

  async getBreedingHistory(
    animalId: string,
    userId: string,
  ): Promise<{ breedings: any[] }> {
    const animal = await this.animalRepository.findById(animalId);
    if (!animal) {
      throw new NotFoundError("Animal not found");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to view this breeding history",
      );
    }

    const breedings =
      await this.breedingRepository.findBreedingHistory(animalId);
    return { breedings: breedings.map((b) => this.mapToResponse(b)) };
  }

  private async buildPedigree(
    startIds: string[],
    depth: number,
  ): Promise<Map<string, any>> {
    const pedigree = new Map<string, any>();
    const queue: { id: string; currentDepth: number }[] = startIds.map(
      (id) => ({ id, currentDepth: 0 }),
    );

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;

      if (currentDepth > depth || pedigree.has(id)) {
        continue;
      }

      const animal = await this.animalRepository.findById(id);
      if (animal) {
        pedigree.set(id, animal);

        if (animal.fatherId && !pedigree.has(animal.fatherId)) {
          queue.push({ id: animal.fatherId, currentDepth: currentDepth + 1 });
        }

        if (animal.motherId && !pedigree.has(animal.motherId)) {
          queue.push({ id: animal.motherId, currentDepth: currentDepth + 1 });
        }
      }
    }

    return pedigree;
  }

  private mapToResponse(breeding: any): any {
    return {
      id: breeding.id,
      maleId: breeding.maleId,
      femaleId: breeding.femaleId,
      projectedCOI: breeding.projectedCOI,
      riskLevel: breeding.riskLevel,
      offspringId: breeding.offspringId || null,
      offspring: breeding.offspring || null,
      breedingDate: breeding.breedingDate?.toISOString() || null,
      notes: breeding.notes || null,
      userId: breeding.userId,
      syncStatus: breeding.syncStatus,
      syncVersion: breeding.syncVersion,
      createdAt: breeding.createdAt.toISOString(),
      updatedAt: breeding.updatedAt.toISOString(),
    };
  }
}
