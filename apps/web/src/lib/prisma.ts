import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // One client and one pg connection per Worker isolate. DATABASE_URL should be a
  // pooled Postgres URL (Supabase transaction pooler, port 6543), not the direct port.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 1 }),
  });
  globalForPrisma.prisma = prisma;

  return prisma;
}
