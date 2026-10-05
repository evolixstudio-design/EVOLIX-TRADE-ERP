import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module';
import { RetailService } from '../src/retail/retail.service';
import { PrismaService } from '../src/database/prisma.service';
import { PosService } from '../src/pos/pos.service';
import { v4 as uuidv4 } from 'uuid';

describe('Retail Flow (e2e)', () => {
  let app: INestApplication;
  let retailService: RetailService;
  let prisma: PrismaService;
  let posService: PosService;

  // Test data context
  let orgId: string;
  let compAId: string;
  let compBId: string;
  let branchAId: string;
  let godownAId: string;
  let fyAId: string;
  let userAId: string;
  let unitId: string;
  
  let testItemId: string;
  let customerId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    retailService = app.get(RetailService);
    prisma = app.get(PrismaService);
    posService = app.get(PosService);

    // Setup isolated test data
    orgId = uuidv4();
    const org = await prisma.organization.create({ data: { id: orgId, name: 'Test Org', code: `ORG-${Date.now()}` } });
    
    const compA = await prisma.company.create({ data: { organization_id: orgId, name: 'Company A', code: `CA-${Date.now()}`, currency: 'INR', financial_year_start_month: 4 } });
    compAId = compA.id;
    
    const compB = await prisma.company.create({ data: { organization_id: orgId, name: 'Company B', code: `CB-${Date.now()}`, currency: 'INR', financial_year_start_month: 4 } });
    compBId = compB.id;

    const branchA = await prisma.branch.create({ data: { company_id: compAId, name: 'Main Branch A', code: `MBA-${Date.now()}` } });
    branchAId = branchA.id;

    const godownA = await prisma.godown.create({ data: { company_id: compAId, branch_id: branchAId, name: 'Main Godown A', code: `MGA-${Date.now()}`, godown_type: 'NORMAL' } });
    godownAId = godownA.id;

    const fyA = await prisma.financialYear.create({ data: { company_id: compAId, name: '2026-2027', start_date: new Date('2026-04-01'), end_date: new Date('2027-03-31'), status: 'OPEN' } });
    fyAId = fyA.id;

    const userA = await prisma.user.create({ data: { organization_id: orgId, username: `usera_${Date.now()}`, display_name: 'User A', password_hash: 'hash' } });
    userAId = userA.id;

    const unit = await prisma.unit.create({ data: { company_id: compAId, name: 'Pieces', code: `PCS-${Date.now()}` } });
    unitId = unit.id;
  });

  afterAll(async () => {
    // Cleanup created data
    await prisma.stockMovement.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.stockBalanceProjection.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.voucherLine.deleteMany({ where: { voucher: { company_id: { in: [compAId, compBId] } } } });
    await prisma.voucher.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.billAllocation.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.salesInvoiceLine.deleteMany({ where: { sales_invoice: { company_id: { in: [compAId, compBId] } } } });
    await prisma.salesInvoice.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.openingStockLine.deleteMany({ where: { opening_stock: { company_id: { in: [compAId, compBId] } } } });
    await prisma.openingStock.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.ledgerAccount.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.party.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.item.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    
    // Core structure
    await prisma.financialYear.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.unit.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.godown.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.branch.deleteMany({ where: { company_id: { in: [compAId, compBId] } } });
    await prisma.company.deleteMany({ where: { id: { in: [compAId, compBId] } } });
    await prisma.user.deleteMany({ where: { id: userAId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    
    await app.close();
  });

  it('should create a Retail item with opening stock', async () => {
    const item = await retailService.createItem(
      compAId, userAId, fyAId, branchAId,
      { name: 'Coca Cola Retail Test', selling_price: 45, opening_stock: 10, purchase_price: 30 }
    );
    expect(item).toBeDefined();
    testItemId = item!.id;

    // Verify DB
    const itemDb = await prisma.item.findUnique({ where: { id: testItemId } });
    expect(itemDb).not.toBeNull();
    
    const proj = await prisma.stockBalanceProjection.findFirst({
      where: { company_id: compAId, item_id: testItemId }
    });
    expect(Number(proj!.quantity)).toBe(10);
  });

  it('should make a CASH sale and deduct stock', async () => {
    const sale = await posService.postPosSale(compAId, userAId, {
      branch_id: branchAId,
      document_date: new Date().toISOString(),
      walkin_name: 'Walkin',
      lines: [{ item_id: testItemId, godown_id: godownAId, quantity: 2, unit_id: unitId, rate: 45 }],
      payments: [{ method: 'CASH', amount: 90 }]
    });
    expect(sale).toBeDefined();
    testInvoiceId = sale.id;

    const proj = await prisma.stockBalanceProjection.findFirst({
      where: { company_id: compAId, item_id: testItemId }
    });
    expect(Number(proj!.quantity)).toBe(8);
  });

  it('should create a customer for Udhar', async () => {
    const rajesh = await retailService.createCustomer(compAId, { name: 'Rajesh Retail Test' });
    expect(rajesh).toBeDefined();
    customerId = rajesh.id;
  });

  it('should make an UDHAR sale (0 payments) creating outstanding balance', async () => {
    const sale = await posService.postPosSale(compAId, userAId, {
      branch_id: branchAId,
      party_id: customerId,
      document_date: new Date().toISOString(),
      lines: [{ item_id: testItemId, godown_id: godownAId, quantity: 2, unit_id: unitId, rate: 45 }],
      payments: [] // Zero payment = Udhar
    });
    expect(sale).toBeDefined();

    const proj = await prisma.stockBalanceProjection.findFirst({
      where: { company_id: compAId, item_id: testItemId }
    });
    expect(Number(proj!.quantity)).toBe(6);

    const customers = await retailService.getCustomers(compAId);
    const rajesh = customers.find(c => c.id === customerId);
    expect(rajesh!.outstanding_amount).toBe(90);
  });

  it('should receive partial payment correctly', async () => {
    const res = await retailService.receivePayment(compAId, branchAId, fyAId, userAId, customerId, {
      amount: 40,
      payment_method: 'CASH',
      date: new Date().toISOString()
    });
    expect(res.success).toBe(true);

    const customers = await retailService.getCustomers(compAId);
    const rajesh = customers.find(c => c.id === customerId);
    expect(rajesh!.outstanding_amount).toBe(50);
  });
  
  it('should correctly isolate tenants', async () => {
    // User from company B shouldn't see items from Company A
    const itemsB = await retailService.getItems(compBId);
    expect(itemsB.length).toBe(0);
  });
});
