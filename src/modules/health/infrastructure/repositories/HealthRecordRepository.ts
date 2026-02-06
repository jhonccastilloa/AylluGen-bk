import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  HealthRecord,
  HealthRecordCreateInput,
  HealthRecordUpdateInput,
  UpcomingHealthTask,
} from "../../../health/domain/entities/HealthRecord";
import { IHealthRecordRepository } from "../../../health/domain/repositories/IHealthRecordRepository";

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

    return records.map((r) => this.mapToEntity(r));
  }

  async findByAnimalId(animalId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { animalId },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async findByType(userId: string, type: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId, type: type as any },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.mapToEntity(r));
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

    return records.map((r) => {
      const daysUntil = Math.ceil(
        (r.nextDueDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      return {
        id: r.id,
        animalId: r.animalId,
        animalCrotal: r.animal.crotal,
        type: r.type as any,
        dueDate: r.nextDueDate!,
        daysUntilDue: daysUntil,
        notes: r.notes,
      };
    }) as any[];
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

    return records.map((r) => this.mapToEntity(r));
  }

  async findPending(userId: string): Promise<HealthRecord[]> {
    const records = await prisma.healthRecord.findMany({
      where: { userId, completed: false },
      include: { animal: true },
      orderBy: { date: "asc" },
    });

    return records.map((r) => this.mapToEntity(r));
  }

  private mapToEntity(data: any): HealthRecord {
    return {
      id: data.id,
      animalId: data.animalId,
      animal: data.animal,
      type: data.type,
      date: data.date,
      notes: data.notes,
      nextDueDate: data.nextDueDate,
      completed: data.completed,
      userId: data.userId,
      syncStatus: data.syncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
