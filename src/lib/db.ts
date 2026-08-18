import dns from 'node:dns';
import { PrismaClient, Prisma } from '@prisma/client';

// Node sometimes resolves Supabase's pooler host to an IPv6 address that's
// unreachable on this network, surfacing as an intermittent "Can't reach
// database server" error. Preferring IPv4 avoids that.
dns.setDefaultResultOrder('ipv4first');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Helper function to check if error is a connection error
export function isConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }

  return false;
}

// Helper function to get user-friendly error message
export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("Can't reach database server")) {
      return 'Database server is unreachable. Please check if your Supabase database is active and the connection string is correct.';
    }
    return 'Database connection error. Please try again later.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown database error occurred.';
}

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = basePrisma;
}

/**
 * Supabase's free tier pauses the project after inactivity and resumes it on
 * the first query, but that first query frequently times out while it wakes
 * up (confirmed empirically: 1st of 8 back-to-back queries failed, rest
 * succeeded instantly). The connection never reached the server, so the
 * query never ran — retrying once is safe.
 */
export const db = basePrisma.$extends({
  query: {
    async $allOperations({ args, query }) {
      try {
        return await query(args);
      } catch (error) {
        if (!isConnectionError(error)) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return query(args);
      }
    },
  },
});
