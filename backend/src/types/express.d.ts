import { PayloadToken } from "../services/auth.service";
import { PrismaTenantClient } from "../lib/prisma-tenant";

declare global {
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
      prisma?: PrismaTenantClient;
    }
  }
}
