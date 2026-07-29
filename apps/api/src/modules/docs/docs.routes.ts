import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiSpec } from "./docs.controller";

const OPENAPI_URL = "/api/openapi.json";

export const docsRouter: Router = Router();

docsRouter.get("/openapi.json", getOpenApiSpec);
docsRouter.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: { url: OPENAPI_URL },
  }),
);
