import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  RiskLevel,
  Breeding,
  BreedingCreateInput,
  SyncStatus,
  BreedingUpdateInput,
} from "../../../breeding/domain/entities/Breeding";
import { Animal, Sex, Species, SyncStatus as AnimalSyncStatus } from "../../../animal/domain/entities/Animal";
import type {
  Animal as PrismaAnimal,
  Breeding as PrismaBreeding,
} from "@infrastructure/database/prisma/generated/client";
import { IBreedingRepository } from "../../../breeding/domain/repositories/IBreedingRepository";

type BreedingWithRelations = PrismaBreeding & {
  offspring?: PrismaAnimal | null;
};

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

  private mapToEntity(data: BreedingWithRelations): Breeding {
    return {
      id: data.id,
      maleId: data.maleId,
      femaleId: data.femaleId,
      projectedCOI: data.projectedCOI,
      riskLevel: data.riskLevel as RiskLevel,
      offspringId: data.offspringId ?? undefined,
      offspring: data.offspring ? this.mapAnimalToEntity(data.offspring) : undefined,
      breedingDate: data.breedingDate ?? undefined,
      notes: data.notes ?? undefined,
      userId: data.userId,
      syncStatus: data.syncStatus as SyncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private mapAnimalToEntity(data: PrismaAnimal): Animal {
    return {
      id: data.id,
      crotal: data.crotal,
      sex: data.sex as Sex,
      species: data.species as Species,
      birthDate: data.birthDate ?? undefined,
      isFounder: data.isFounder,
      fatherId: data.fatherId ?? undefined,
      motherId: data.motherId ?? undefined,
      userId: data.userId,
      syncStatus: data.syncStatus as AnimalSyncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt ?? undefined,
    };
  }
}
