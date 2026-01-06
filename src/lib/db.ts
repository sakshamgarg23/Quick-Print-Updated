import { PrismaClient, Prisma } from '@prisma/client';


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
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
  globalForPrisma.prisma = db;
}

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
