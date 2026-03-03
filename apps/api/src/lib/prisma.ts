/**
 * Prisma Client Singleton
 *
 * Creates and exports a single PrismaClient instance for use across the application.
 * Uses the @prisma/adapter-pg driver adapter for PostgreSQL connections via
 * Prisma Accelerate (configured through DATABASE_URL env var).
 *
 * Import this module wherever database access is needed:
 * ```ts
 * import prisma from "../../lib/prisma.js";
 * ```
 */

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Create a PostgreSQL adapter using the connection string from environment
const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

// Initialize PrismaClient with the PostgreSQL adapter
const prisma = new PrismaClient({ adapter: pool });

export default prisma;
