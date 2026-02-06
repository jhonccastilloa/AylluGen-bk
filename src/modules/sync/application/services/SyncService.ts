import { injectable, inject } from "inversify";
import { ISyncRepository } from "../../domain/repositories/ISyncRepository";
import { TYPES } from "../../../../shared/di/types";
import {
  NotFoundError,
  ValidationError,
} from "../../../../shared/errors/AppError";
import { prisma } from "../../../../infrastructure/database/prisma/client";
import { SyncPullInput, SyncPushInput } from "../schemas/sync.schema";

@injectable()
export class SyncService {
  constructor(
    @inject(TYPES.ISyncRepository) private syncRepository: ISyncRepository,
  ) {}

  async pushChanges(data: SyncPushInput): Promise<any> {
    const conflicts: any[] = [];
    const errors: any[] = [];
    let syncedChanges = 0;

    for (const change of data.changes) {
      try {
        const result = await this.processChange(data.userId, change);
        if (result.conflict) {
          conflicts.push({
            tableName: change.tableName,
            recordId: change.recordId,
            serverVersion: result.serverVersion,
            clientVersion: change.data,
          });
        } else {
          syncedChanges++;
        }
      } catch (error) {
        errors.push({
          tableName: change.tableName,
          recordId: change.recordId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await this.syncRepository.saveLatestSync(data.userId, new Date());

    return {
      success: errors.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      errors: errors.length > 0 ? errors : undefined,
      syncedChanges,
    };
  }

  async pullChanges(data: SyncPullInput): Promise<any> {
    const lastSyncAt = data.lastSyncAt ? new Date(data.lastSyncAt) : undefined;

    const result: any = {
      syncTimestamp: new Date().toISOString(),
    };

    for (const table of data.tables) {
      const records = await this.fetchTableData(data.userId, table, lastSyncAt);
      result[this.camelCase(table)] = records;
    }

    return result;
  }

  async resolveConflict(
    tableName: string,
    recordId: string,
    resolution: string,
  ): Promise<void> {
    if (resolution === "server") {
      const record = await this.getPrismaTable(tableName).findUnique({
        where: { id: recordId },
      });

      if (!record) {
        throw new NotFoundError("Record not found");
      }

      await this.getPrismaTable(tableName).update({
        where: { id: recordId },
        data: { syncStatus: "SYNCED" },
      });
    } else {
      await this.syncRepository.deleteLogs("", new Date());
    }
  }

  private async processChange(
    userId: string,
    change: any,
  ): Promise<{ conflict: boolean; serverVersion?: any }> {
    const table = this.getPrismaTable(change.tableName);

    if (change.action === "DELETE") {
      const record = await table.findUnique({ where: { id: change.recordId } });

      if (!record) {
        return { conflict: false };
      }

      if (record.userId !== userId) {
        throw new ValidationError(
          "You do not have permission to delete this record",
        );
      }

      if (change.tableName === "animals") {
        await table.update({
          where: { id: change.recordId },
          data: { deletedAt: new Date(), syncStatus: "DELETED" },
        });
      } else {
        await table.delete({ where: { id: change.recordId } });
      }

      return { conflict: false };
    }

    if (change.action === "CREATE") {
      const existing = await table.findUnique({
        where: { id: change.recordId },
      });

      if (existing) {
        return { conflict: true, serverVersion: existing };
      }

      const createData = this.transformForCreate(change.data);
      await table.create({
        data: { ...createData, id: change.recordId, userId },
      });

      return { conflict: false };
    }

    if (change.action === "UPDATE") {
      const record = await table.findUnique({ where: { id: change.recordId } });

      if (!record) {
        return { conflict: true, serverVersion: null };
      }

      if (record.userId !== userId) {
        throw new ValidationError(
          "You do not have permission to update this record",
        );
      }

      if (record.syncVersion > change.clientVersion) {
        return { conflict: true, serverVersion: record };
      }

      const updateData = this.transformForUpdate(change.data);
      await table.update({
        where: { id: change.recordId },
        data: {
          ...updateData,
          syncVersion: { increment: 1 },
          syncStatus: "SYNCED",
        },
      });

      return { conflict: false };
    }

    return { conflict: false };
  }

  private async fetchTableData(
    userId: string,
    tableName: string,
    lastSyncAt?: Date,
  ): Promise<any[]> {
    const table = this.getPrismaTable(tableName);

    const whereClause: any = { userId, deletedAt: null };

    if (lastSyncAt) {
      whereClause.updatedAt = { gte: lastSyncAt };
    }

    const records = await table.findMany({
      where: whereClause,
      orderBy: { updatedAt: "asc" },
    });

    return records;
  }

  private getPrismaTable(tableName: string): any {
    switch (tableName) {
      case "animals":
        return prisma.animal;
      case "breedings":
        return prisma.breeding;
      case "health_records":
        return prisma.healthRecord;
      case "production_records":
        return prisma.productionRecord;
      default:
        throw new ValidationError(`Unknown table: ${tableName}`);
    }
  }

  private transformForCreate(data: any): any {
    const result: any = {};

    for (const key in data) {
      if (key !== "id" && key !== "userId") {
        if (typeof data[key] === "string" && this.isDateString(data[key])) {
          result[key] = new Date(data[key]);
        } else {
          result[key] = data[key];
        }
      }
    }

    return result;
  }

  private transformForUpdate(data: any): any {
    const result: any = {};

    for (const key in data) {
      if (key !== "id" && key !== "userId") {
        if (typeof data[key] === "string" && this.isDateString(data[key])) {
          result[key] = new Date(data[key]);
        } else {
          result[key] = data[key];
        }
      }
    }

    return result;
  }

  private isDateString(str: string): boolean {
    return !isNaN(Date.parse(str));
  }

  private camelCase(str: string): string {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }
}
