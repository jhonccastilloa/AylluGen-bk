import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  Breeding,
  BreedingCreateInput,
  BreedingUpdateInput,
} from "../../../breeding/domain/entities/Breeding";
import { IBreedingRepository } from "../../../breeding/domain/repositories/IBreedingRepository";

@injectable()
export class BreedingRepository implements IBreedingRepository {
  async findById(id: string): Promise<Breeding | null> {
    const breeding = await prisma.breeding.findUnique({
      where: { id },
      include: { offspring: true },
    });

    return breeding ? this.mapToEntity(breeding) : null;
  }

  async findByParents(
    maleId: string,
    femaleId: string,
  ): Promise<Breeding | null> {
    const breeding = await prisma.breeding.findFirst({
      where: { maleId, femaleId },
      include: { offspring: true },
    });

    return breeding ? this.mapToEntity(breeding) : null;
  }

  async findAllByUserId(userId: string): Promise<Breeding[]> {
    const breedings = await prisma.breeding.findMany({
      where: { userId },
      include: { offspring: true },
      orderBy: { createdAt: "desc" },
    });

    return breedings.map((b) => this.mapToEntity(b));
  }

  async create(data: BreedingCreateInput): Promise<Breeding> {
    const breeding = await prisma.breeding.create({
      data,
      include: { offspring: true },
    });

    return this.mapToEntity(breeding);
  }

  async update(id: string, data: BreedingUpdateInput): Promise<Breeding> {
    const breeding = await prisma.breeding.update({
      where: { id },
      data: { ...data, syncVersion: { increment: 1 } },
      include: { offspring: true },
    });

    return this.mapToEntity(breeding);
  }

  async delete(id: string): Promise<void> {
    await prisma.breeding.delete({ where: { id } });
  }

  async findBreedingHistory(animalId: string): Promise<Breeding[]> {
    const breedings = await prisma.breeding.findMany({
      where: { OR: [{ maleId: animalId }, { femaleId: animalId }] },
      include: { offspring: true },
      orderBy: { createdAt: "desc" },
    });

    return breedings.map((b) => this.mapToEntity(b));
  }

  private mapToEntity(data: any): Breeding {
    return {
      id: data.id,
      maleId: data.maleId,
      femaleId: data.femaleId,
      projectedCOI: data.projectedCOI,
      riskLevel: data.riskLevel,
      offspringId: data.offspringId,
      offspring: data.offspring,
      breedingDate: data.breedingDate,
      notes: data.notes,
      userId: data.userId,
      syncStatus: data.syncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
