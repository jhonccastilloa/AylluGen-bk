import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  HealthRecord,
  HealthRecordCreateInput,
  HealthRecordUpdateInput,
  HealthType,
  SyncStatus,
  UpcomingHealthTask,
} from "../../../health/domain/entities/HealthRecord";
import { IHealthRecordRepository } from "../../../health/domain/repositories/IHealthRecordRepository";
import {
  Animal,
  Sex,
  Species,
  SyncStatus as AnimalSyncStatus,
} from "../../../animal/domain/entities/Animal";
import type {
  Animal as PrismaAnimal,
  HealthRecord as PrismaHealthRecord,
} from "@infrastructure/database/prisma/generated/client";

type HealthRecordWithAnimal = PrismaHealthRecord & {
  animal?: PrismaAnimal | null;
};

@injectable()
export class HealthRecordRepository implements IHealthRecordRepository {
  async findById(id: string): Promise<HealthRecord | null> {
    const record = await prisma.healthRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findAllByUserId(userId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findByAnimalId(animalId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { animalId },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findByType(userId: string, type: HealthType): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId, type },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findUpcoming(
    userId: string,
    daysAhead = 30,
  ): Promise<UpcomingHealthTask[]> {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const records = await prisma.healthRecord.findMany({
      where: {
        userId,
        nextDueDate: { gte: now, lte: future },
      },
      include: { animal: true },
      orderBy: { nextDueDate: "asc" },
    });

    return records
      .map((record): UpcomingHealthTask | null => {
        if (!record.nextDueDate) {
          return null;
        }

        const daysUntil = Math.ceil(
          (record.nextDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        return {
          id: record.id,
          animalId: record.animalId,
          animalCrotal: record.animal.crotal,
          type: record.type as HealthType,
          dueDate: record.nextDueDate,
          daysUntilDue: daysUntil,
          notes: record.notes ?? undefined,
        };
      })
      .filter((task): task is UpcomingHealthTask => task !== null);
  }

  async create(data: HealthRecordCreateInput): Promise<HealthRecord> {
    const record = await prisma.healthRecord.create({
      data,
      include: { animal: true },
    });

    return this.mapToEntity(record);
  }

  async update(
    id: string,
    data: HealthRecordUpdateInput,
  ): Promise<HealthRecord> {
    const record = await prisma.healthRecord.update({
      where: { id },
      data: { ...data, syncVersion: { increment: 1 } },
      include: { animal: true },
    });

    return this.mapToEntity(record);
  }

  async delete(id: string): Promise<void> {
    await prisma.healthRecord.delete({ where: { id } });
  }

  async findCompleted(userId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId, completed: true },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  async findPending(userId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId, completed: false },
      include: { animal: true },
      orderBy: { date: "asc" },
    });

    return records.map((record) => this.mapToEntity(record));
  }

  private mapToEntity(data: HealthRecordWithAnimal): HealthRecord {
    return {
      id: data.id,
      animalId: data.animalId,
      animal: data.animal ? this.mapAnimalToEntity(data.animal) : undefined,
      type: data.type as HealthType,
      date: data.date,
      notes: data.notes ?? undefined,
      nextDueDate: data.nextDueDate ?? undefined,
      completed: data.completed,
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
