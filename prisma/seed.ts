import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user first (if needed)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      clerkId: 'test_clerk_id',
      passwordHash: 'dummy_hash_for_testing', // Add this field
    },
  });

  console.log('Created user:', user);

  // Create a test printer
  const printer = await prisma.printer.upsert({
    where: { printerEmail: '52h758pg@hpeprint.com' },
    update: {},
    create: {
      id: 'test123',
      printerName: 'Test Printer',
      printerEmail: '52h758pg@hpeprint.com',
      ownerId: user.id,
      location: 'DELHI',
      description: 'A test printer for development',
      status: 'ACTIVE',
      qrCodeData: JSON.stringify({ id: 'test123' }),
      priceBwSingle: 2.0,
      priceBwDouble: 3.0,
      priceColorSingle: 5.0,
      priceColorDouble: 8.0,
      supportsColor: true,
      supportsDoubleSided: true,
      supportedPageSizes: ['A4', 'LETTER'],
    },
  });

  console.log('✅ Created printer:', printer.printerName);
  console.log('📧 Email:', printer.printerEmail);
  console.log('📍 Status:', printer.status);
  console.log('🆔 ID:', printer.id);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });