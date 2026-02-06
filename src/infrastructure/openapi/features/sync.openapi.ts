import { z } from "zod";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import {
  syncPushSchema,
  syncPullSchema,
  syncResultSchema,
  syncDataSchema,
  conflictResolutionSchema,
} from "../../../modules/sync/application/schemas/sync.schema";

export function registerSyncRoutes(
  registry: OpenAPIRegistry,
  bearerAuth: { name: string },
) {
  registry.registerPath({
    method: "post",
    path: "/api/sync/push",
    tags: ["Sync"],
    summary: "Enviar cambios al servidor",
    description:
      "Envía cambios desde el cliente al servidor para sincronización",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: syncPushSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Sincronización exitosa",
        content: {
          "application/json": {
            schema: syncResultSchema,
          },
        },
      },
      400: {
        description: "Datos inválidos",
      },
      401: {
        description: "No autorizado",
      },
      409: {
        description: "Conflictos de sincronización",
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/sync/pull",
    tags: ["Sync"],
    summary: "Obtener cambios del servidor",
    description: "Obtiene cambios del servidor para sincronizar el cliente",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: syncPullSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Datos de sincronización",
        content: {
          "application/json": {
            schema: syncDataSchema,
          },
        },
      },
      400: {
        description: "Datos inválidos",
      },
      401: {
        description: "No autorizado",
      },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/sync/resolve-conflict",
    tags: ["Sync"],
    summary: "Resolver conflicto de sincronización",
    description: "Resuelve un conflicto de sincronización específico",
    security: [{ [bearerAuth.name]: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: conflictResolutionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Conflicto resuelto",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
      400: {
        description: "Datos inválidos",
      },
      401: {
        description: "No autorizado",
      },
      404: {
        description: "Conflicto no encontrado",
      },
    },
  });
}
