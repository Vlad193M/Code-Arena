import type { Request, Response } from "express";
import { openApiDocument } from "../../lib/openapi";

export const getOpenApiSpec = (_req: Request, res: Response): void => {
  res.json(openApiDocument);
};
