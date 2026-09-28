import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Applying unique index for inventory idempotency...');
    // Create unique index concurrently without locking the table.
    // Notice that source_line_id could be null, but PostgreSQL unique indexes treat nulls as distinct.
    // This is generally fine for our use case, but we will use COALESCE if needed, 
    // or just rely on the fact that GRN/Invoice lines always have IDs.
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uix_stock_movement_source 
      ON stock_movements (company_id, movement_type, source_document_type, source_document_id, COALESCE(source_line_id, '00000000-0000-0000-0000-000000000000'));
    `);
    console.log('Index applied successfully.');
  } catch (error) {
    console.error('Failed to apply index:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
