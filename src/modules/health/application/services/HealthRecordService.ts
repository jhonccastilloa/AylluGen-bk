import { injectable, inject } from "inversify";
import { IHealthRecordRepository } from "../../domain/repositories/IHealthRecordRepository";
import { IAnimalRepository } from "../../../animal/domain/repositories/IAnimalRepository";
import { TYPES } from "../../../../shared/di/types";
import {
  HealthRecordCreateInput,
  HealthRecordUpdateInput,
} from "../schemas/health.schema";
import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/AppError";

@injectable()
export class HealthRecordService {
  constructor(
    @inject(TYPES.IHealthRecordRepository)
    private healthRecordRepository: IHealthRecordRepository,
    @inject(TYPES.IAnimalRepository)
    private animalRepository: IAnimalRepository,
  ) {}

  async create(userId: string, data: HealthRecordCreateInput): Promise<any> {
    const animal = await this.animalRepository.findById(data.animalId);
    if (!animal) {
      throw new NotFoundError("Animal not found");
    }

    if (animal.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to access this animal",
      );
    }

    const record = await this.healthRecordRepository.create({
      ...data,
      userId,
      date: new Date(data.date),
      nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : undefined,
    });

    return this.mapToResponse(record);
  }

  async update(
    id: string,
    userId: string,
    data: HealthRecordUpdateInput,
  ): Promise<any> {
    const record = await this.healthRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError("Health record not found");
    }

    if (record.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to update this health record",
      );
    }

    const updateData: any = { ...data };
    if (data.date !== undefined && data.date !== null && data.date !== "") {
      updateData.date = new Date(data.date);
    }
    if (
      data.nextDueDate !== undefined &&
      data.nextDueDate !== null &&
      data.nextDueDate !== ""
    ) {
      updateData.nextDueDate = new Date(data.nextDueDate);
    }
    if (data.nextDueDate) {
      updateData.nextDueDate = new Date(data.nextDueDate);
    }

    const updated = await this.healthRecordRepository.update(id, updateData);

    return this.mapToResponse(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const record = await this.healthRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError("Health record not found");
    }

    if (record.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to delete this health record",
      );
    }

    await this.healthRecordRepository.delete(id);
  }

  async getById(id: string, userId: string): Promise<any> {
    const record = await this.healthRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError("Health record not found");
    }

    if (record.userId !== userId) {
      throw new ValidationError(
        "You do not have permission to view this health record",
      );
    }

    return this.mapToResponse(record);
  }

  async getAll(
    userId: string,
    animalId?: string,
    type?: string,
    completed?: boolean,
  ): Promise<{ records: any[] }> {
    if (animalId) {
      const animal = await this.animalRepository.findById(animalId);
      if (!animal || animal.userId !== userId) {
        throw new ValidationError(
          "You do not have permission to view these health records",
        );
      }
      const records =
        await this.healthRecordRepository.findByAnimalId(animalId);
      return { records: records.map((r) => this.mapToResponse(r)) };
    }

    if (type) {
      const records = await this.healthRecordRepository.findByType(
        userId,
        type,
      );
      return { records: records.map((r) => this.mapToResponse(r)) };
    }

    if (completed !== undefined) {
      const records = completed
        ? await this.healthRecordRepository.findCompleted(userId)
        : await this.healthRecordRepository.findPending(userId);
      return { records: records.map((r) => this.mapToResponse(r)) };
    }

    const records = await this.healthRecordRepository.findAllByUserId(userId);
    return { records: records.map((r) => this.mapToResponse(r)) };
  }

  async getUpcomingTasks(userId: string, daysAhead?: number) {
    const tasks = await this.healthRecordRepository.findUpcoming(
      userId,
      daysAhead,
    );
    return {
      tasks: tasks.map((t) => ({
        id: t.id,
        animalId: t.animalId,
        animalCrotal: t.animalCrotal,
        type: t.type,
        dueDate: t.dueDate.toISOString(),
        daysUntilDue: t.daysUntilDue,
        notes: t.notes,
      })),
    };
  }

  private mapToResponse(record: any) {
    return {
      id: record.id,
      animalId: record.animalId,
      animal: record.animal,
      type: record.type,
      date: record.date.toISOString(),
      notes: record.notes || null,
      nextDueDate: record.nextDueDate?.toISOString() || null,
      completed: record.completed,
      userId: record.userId,
      syncStatus: record.syncStatus,
      syncVersion: record.syncVersion,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
