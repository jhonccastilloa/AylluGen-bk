import { injectable } from "inversify";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import {
  ProductionRecord,
  ProductionRecordCreateInput,
  ProductionRecordUpdateInput,
  ProductionSummary,
} from "../../../production/domain/entities/ProductionRecord";
import { IProductionRecordRepository } from "../../../production/domain/repositories/IProductionRecordRepository";

@injectable()
export class ProductionRecordRepository implements IProductionRecordRepository {
  async findById(id: string): Promise<ProductionRecord | null> {
    const record = await prisma.productionRecord.findUnique({
      where: { id },
      include: { animal: true },
    });

    return record ? this.mapToEntity(record) : null;
  }

  async findAllByUserId(userId: string): Promise<ProductionRecord[]> {
    const records = await prisma.productionRecord.findMany({
      where: { userId },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async findByAnimalId(animalId: string): Promise<ProductionRecord[]> {
    const records = await prisma.productionRecord.findMany({
      where: { animalId },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async findByType(userId: string, type: string): Promise<ProductionRecord[]> {
    const records = await prisma.productionRecord.findMany({
      where: { userId, type: type as any },
      include: { animal: true },
      orderBy: { date: "desc" },
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async create(data: ProductionRecordCreateInput): Promise<ProductionRecord> {
    const record = await prisma.productionRecord.create({
      data,
      include: { animal: true },
    });

    return this.mapToEntity(record);
  }

  async update(
    id: string,
    data: ProductionRecordUpdateInput,
  ): Promise<ProductionRecord> {
    const record = await prisma.productionRecord.update({
      where: { id },
      data: { ...data, syncVersion: { increment: 1 } },
      include: { animal: true },
    });

    return this.mapToEntity(record);
  }

  async delete(id: string): Promise<void> {
    await prisma.productionRecord.delete({ where: { id } });
  }

  async findRecentByAnimal(
    animalId: string,
    limit = 10,
  ): Promise<ProductionRecord[]> {
    const records = await prisma.productionRecord.findMany({
      where: { animalId },
      include: { animal: true },
      orderBy: { date: "desc" },
      take: limit,
    });

    return records.map((r) => this.mapToEntity(r));
  }

  async calculateSummary(
    animalId: string,
    type: string,
  ): Promise<ProductionSummary | null> {
    const records = await prisma.productionRecord.findMany({
      where: { animalId, type: type as any },
      orderBy: { date: "asc" },
    });

    if (records.length === 0) return null;

    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal) return null;

    const values = records.map((r) => r.value);
    const averageValue = values.reduce((sum, v) => sum + v, 0) / values.length;

    const qualityScores = records
      .filter((r) => r.qualityScore !== null)
      .map((r) => r.qualityScore!);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, s) => sum + s, 0) / qualityScores.length
        : null;

    const half = Math.floor(values.length / 2);
    const recentValues = values.slice(-half);
    const olderValues = values.slice(0, half);
    const recentAvg =
      recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    const olderAvg =
      olderValues.reduce((sum, v) => sum + v, 0) / olderValues.length;

    let trend: "improving" | "stable" | "declining" = "stable";
    const diff = recentAvg - olderAvg;
    const threshold = olderAvg * 0.05;

    if (diff > threshold) {
      trend = "improving";
    } else if (diff < -threshold) {
      trend = "declining";
    }

    return {
      animalId,
      animalCrotal: animal.crotal,
      type: type as any,
      totalRecords: records.length,
      averageValue,
      averageQualityScore,
      lastRecord: records[records.length - 1].date,
      trend,
    };
  }

  private mapToEntity(data: any): ProductionRecord {
    return {
      id: data.id,
      animalId: data.animalId,
      animal: data.animal,
      type: data.type,
      date: data.date,
      value: data.value,
      unit: data.unit,
      qualityScore: data.qualityScore,
      notes: data.notes,
      userId: data.userId,
      syncStatus: data.syncStatus,
      syncVersion: data.syncVersion,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
