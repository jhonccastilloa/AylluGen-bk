import { SyncService } from "../../../src/modules/sync/application/services/SyncService";
import { ISyncRepository } from "../../../src/modules/sync/domain/repositories/ISyncRepository";
import {
  NotFoundError,
  ValidationError,
} from "../../../src/shared/errors/AppError";
import { TYPES } from "../../../src/shared/di/types";
import { Container } from "inversify";
import { prisma } from "../../../src/infrastructure/database/prisma/client";

jest.mock("../../../src/infrastructure/database/prisma/client");

describe("SyncService", () => {
  let syncService: SyncService;
  let syncRepository: jest.Mocked<ISyncRepository>;
  let container: Container;

  const userId = "user-123";
  const deviceId = "device-123";
  const recordId = "record-123";

  const mockSyncPushData = {
    userId,
    deviceId,
    changes: [
      {
        action: "CREATE" as const,
        tableName: "animals",
        recordId,
        data: {
          crotal: "CR12345",
          sex: "FEMALE",
          species: "SHEEP",
          isFounder: true,
        },
        clientVersion: 1,
      },
    ],
  };

  const mockSyncPullData = {
    userId,
    deviceId,
    lastSyncAt: "2024-01-01T00:00:00.000Z",
    tables: ["animals", "breedings", "health_records", "production_records"],
  };

  beforeEach(() => {
    container = new Container();
    syncRepository = {
      createLog: jest.fn(),
      findPendingLogs: jest.fn(),
      updateLogStatus: jest.fn(),
      deleteLogs: jest.fn(),
      findLatestSync: jest.fn(),
      saveLatestSync: jest.fn(),
    };

    container
      .bind<ISyncRepository>(TYPES.ISyncRepository)
      .toConstantValue(syncRepository);
    syncService = container.get<SyncService>(SyncService);

    (prisma.animal.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.animal.create as jest.Mock).mockResolvedValue({ id: recordId });
    (prisma.animal.update as jest.Mock).mockResolvedValue({ id: recordId });
    (prisma.animal.delete as jest.Mock).mockResolvedValue(undefined);
    (prisma.animal.findMany as jest.Mock).mockResolvedValue([]);

    syncRepository.saveLatestSync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("pushChanges", () => {
    it("should push changes successfully", async () => {
      const result = await syncService.pushChanges(mockSyncPushData);

      expect(result.success).toBe(true);
      expect(result.syncedChanges).toBe(1);
      expect(result.conflicts).toBeUndefined();
      expect(result.errors).toBeUndefined();
      expect(syncRepository.saveLatestSync).toHaveBeenCalledWith(
        userId,
        expect.any(Date),
      );
    });

    it("should handle conflicts when record already exists on CREATE", async () => {
      (prisma.animal.findUnique as jest.Mock).mockResolvedValueOnce({
        id: recordId,
        userId,
      });

      const result = await syncService.pushChanges(mockSyncPushData);

      expect(result.success).toBe(true);
      expect(result.syncedChanges).toBe(0);
      expect(result.conflicts).toBeDefined();
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts?.[0].tableName).toBe("animals");
      expect(result.conflicts?.[0].recordId).toBe(recordId);
    });

    it("should handle errors during sync", async () => {
      (prisma.animal.create as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      const result = await syncService.pushChanges(mockSyncPushData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].tableName).toBe("animals");
    });

    it("should handle DELETE action successfully", async () => {
      const deleteData = {
        ...mockSyncPushData,
        changes: [
          {
            action: "DELETE" as const,
            tableName: "animals",
            recordId,
            data: {},
            clientVersion: 1,
          },
        ],
      };

      (prisma.animal.findUnique as jest.Mock).mockResolvedValueOnce({
        id: recordId,
        userId,
      });

      const result = await syncService.pushChanges(deleteData);

      expect(result.success).toBe(true);
      expect(result.syncedChanges).toBe(1);
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: { deletedAt: expect.any(Date), syncStatus: "DELETED" },
      });
    });

    it("should throw ValidationError when user does not own record", async () => {
      const updateData = {
        ...mockSyncPushData,
        changes: [
          {
            action: "UPDATE" as const,
            tableName: "animals",
            recordId,
            data: { crotal: "CR12346" },
            clientVersion: 1,
          },
        ],
      };

      (prisma.animal.findUnique as jest.Mock).mockResolvedValueOnce({
        id: recordId,
        userId: "other-user",
      });

      const result = await syncService.pushChanges(updateData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toContain("permission");
    });
  });

  describe("pullChanges", () => {
    it("should pull changes successfully", async () => {
      const mockAnimals = [
        { id: recordId, crotal: "CR12345", userId, deletedAt: null },
      ];

      (prisma.animal.findMany as jest.Mock).mockResolvedValue(mockAnimals);

      const result = await syncService.pullChanges(mockSyncPullData);

      expect(result.syncTimestamp).toBeDefined();
      expect(result.animals).toEqual(mockAnimals);
    });

    it("should filter by lastSyncAt when provided", async () => {
      const lastSyncDate = new Date("2024-01-01");
      const pullDataWithLastSync = {
        ...mockSyncPullData,
        lastSyncAt: lastSyncDate.toISOString(),
      };

      await syncService.pullChanges(pullDataWithLastSync);

      expect(prisma.animal.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
          updatedAt: { gte: lastSyncDate },
        },
        orderBy: { updatedAt: "asc" },
      });
    });

    it("should pull only specified tables", async () => {
      const pullDataLimited = {
        ...mockSyncPullData,
        tables: ["animals", "breedings"],
      };

      await syncService.pullChanges(pullDataLimited);

      expect(prisma.animal.findMany).toHaveBeenCalled();
    });

    it("should handle empty tables array", async () => {
      const pullDataEmpty = {
        ...mockSyncPullData,
        tables: [],
      };

      const result = await syncService.pullChanges(pullDataEmpty);

      expect(result.syncTimestamp).toBeDefined();
      expect(result.animals).toBeUndefined();
    });
  });

  describe("resolveConflict", () => {
    it("should resolve conflict with server version", async () => {
      (prisma.animal.findUnique as jest.Mock).mockResolvedValue({
        id: recordId,
      });
      (prisma.animal.update as jest.Mock).mockResolvedValue({ id: recordId });

      await syncService.resolveConflict("animals", recordId, "server");

      expect(prisma.animal.findUnique).toHaveBeenCalledWith({
        where: { id: recordId },
      });
      expect(prisma.animal.update).toHaveBeenCalledWith({
        where: { id: recordId },
        data: { syncStatus: "SYNCED" },
      });
    });

    it("should throw NotFoundError when record not found", async () => {
      (prisma.animal.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        syncService.resolveConflict("animals", recordId, "server"),
      ).rejects.toThrow(NotFoundError);
    });

    it("should handle client version resolution", async () => {
      await syncService.resolveConflict("animals", recordId, "client");

      expect(syncRepository.deleteLogs).toHaveBeenCalledWith(
        "",
        expect.any(Date),
      );
    });
  });
});
