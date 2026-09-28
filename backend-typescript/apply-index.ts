import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uix_voucher_source 
    ON vouchers (company_id, voucher_type, source_document_type, source_document_id);
  `);
  console.log('Index created safely without losing data!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
