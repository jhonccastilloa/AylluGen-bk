import { SyncLog, SyncStatus } from "../entities/Sync";

export interface ISyncRepository {
  createLog(log: Omit<SyncLog, "id" | "createdAt">): Promise<SyncLog>;
  findPendingLogs(userId: string): Promise<SyncLog[]>;
  updateLogStatus(id: string, status: SyncStatus): Promise<void>;
  deleteLogs(userId: string, olderThan: Date): Promise<void>;
  findLatestSync(userId: string): Promise<Date | null>;
  saveLatestSync(userId: string, timestamp: Date): Promise<void>;
}

export interface ISyncService {
  pushChanges(data: any): Promise<any>;
  pullChanges(data: any): Promise<any>;
  resolveConflict(
    tableName: string,
    recordId: string,
    resolution: string,
  ): Promise<void>;
}
