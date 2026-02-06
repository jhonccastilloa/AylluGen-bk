import { Response, NextFunction } from "express";
import { AppRequest } from "./types";
import {
  BaseErrorHandler,
  ZodValidationErrorHandler,
  RawZodErrorHandler,
  AppErrorHandler,
  JwtTokenErrorHandler,
  JwtExpiredTokenErrorHandler,
  DefaultErrorHandler,
} from "./error-handlers/index";

const errorHandlers: BaseErrorHandler[] = [
  new ZodValidationErrorHandler(),
  new RawZodErrorHandler(),
  new AppErrorHandler(),
  new JwtTokenErrorHandler(),
  new JwtExpiredTokenErrorHandler(),
  new DefaultErrorHandler(),
];

export const errorHandler = (
  err: Error,
  req: AppRequest,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);
  const handler = errorHandlers.find((h) => h.canHandle(err));
  handler?.handle(err, req, res);
};

export const notFoundHandler = (_req: AppRequest, res: Response): void => {
  res.status(404).json({
    error: "Route not found",
    code: "ROUTE_NOT_FOUND",
  });
};
