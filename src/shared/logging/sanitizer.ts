import { loggerConfig } from "./logger.config";

const MAX_DEPTH = 10;
const MAX_ARRAY_LENGTH = 100;

function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();
  return loggerConfig.sanitization.sensitiveKeys.some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey.toLowerCase()),
  );
}

export function sanitize(obj: any, depth = 0): any {
  if (depth > MAX_DEPTH) {
    return "[MAX_DEPTH_REACHED]";
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return obj;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: loggerConfig.sanitization.enabled ? undefined : obj.stack,
    };
  }

  if (Array.isArray(obj)) {
    if (obj.length > MAX_ARRAY_LENGTH) {
      return sanitize(obj.slice(0, MAX_ARRAY_LENGTH), depth + 1).concat(
        `[...${obj.length - MAX_ARRAY_LENGTH} more items]`,
      );
    }
    return obj.map((item) => sanitize(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, any> = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.bind(obj)(key)) {
        if (isSensitiveKey(key)) {
          sanitized[key] = loggerConfig.sanitization.replacement;
        } else {
          sanitized[key] = sanitize(obj[key], depth + 1);
        }
      }
    }
    return sanitized;
  }

  return String(obj);
}

export function sanitizeString(str: string): string {
  let result = str;
  loggerConfig.sanitization.sensitiveKeys.forEach((key) => {
    const regex = new RegExp(
      `(["']${key}["']\\s*:\\s*["'])([^"']+)(["'])`,
      "gi",
    );
    result = result.replace(
      regex,
      `$1${loggerConfig.sanitization.replacement}$3`,
    );
  });
  return result;
}
