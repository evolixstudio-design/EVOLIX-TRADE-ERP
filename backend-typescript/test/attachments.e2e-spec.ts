import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

describe('Attachment Storage (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  let orgId: string;
  let compAId: string;
  let compBId: string;
  let branchId: string;
  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    
    prisma = app.get(PrismaService);
    
    orgId = uuidv4();
    await prisma.organization.create({ data: { id: orgId, name: 'Att Org', code: `ATT-ORG-${Date.now()}` }});
    const compA = await prisma.company.create({ data: { organization_id: orgId, legal_name: 'Att Comp A', trade_name: 'Att Comp A', code: `ATT-CA-${Date.now()}` }});
    compAId = compA.id;
    const compB = await prisma.company.create({ data: { organization_id: orgId, legal_name: 'Att Comp B', trade_name: 'Att Comp B', code: `ATT-CB-${Date.now()}` }});
    compBId = compB.id;
    
    const branch = await prisma.branch.create({ data: { company_id: compAId, name: 'Att Branch', code: `ATT-BR-${Date.now()}` }});
    branchId = branch.id;
    
    const roleA = await prisma.role.create({ data: { organization_id: orgId, name: `ADMIN-${Date.now()}` }});
    const roleB = await prisma.role.create({ data: { organization_id: orgId, name: `ADMIN-B-${Date.now()}` }});

    const hash = bcrypt.hashSync('123', 10);
    
    const userAName = `atta-${Date.now()}`;
    const userA = await prisma.user.create({ data: { organization_id: orgId, username: userAName, password_hash: hash, display_name: 'Att A' }});
    userAId = userA.id;
    await prisma.userRole.create({ data: { user_id: userAId, role_id: roleA.id, company_id: compAId, branch_id: branchId }});

    const userBName = `attb-${Date.now()}`;
    const userB = await prisma.user.create({ data: { organization_id: orgId, username: userBName, password_hash: hash, display_name: 'Att B' }});
    userBId = userB.id;
    await prisma.userRole.create({ data: { user_id: userBId, role_id: roleB.id, company_id: compBId }});

    const resA = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ username: userAName, password: '123' });
    if (!resA.body.access_token) console.log('resA body:', resA.body);
    tokenA = resA.body.access_token;
    
    const resB = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ username: userBName, password: '123' });
    if (!resB.body.access_token) console.log('resB body:', resB.body);
    tokenB = resB.body.access_token;
    
    // Create a dummy file
    fs.writeFileSync('test-image.jpg', 'dummy image content');
    fs.writeFileSync('test-image.txt', 'dummy text content');
  }, 30000);

  afterAll(async () => {
    // Teardown
    if (prisma) {
      await prisma.attachment.deleteMany({ where: { company_id: { in: [compAId, compBId].filter((id): id is string => !!id) } }});
    await prisma.userRole.deleteMany({ where: { user_id: { in: [userAId, userBId].filter((id): id is string => !!id) } }});
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId].filter((id): id is string => !!id) } }});
    await prisma.role.deleteMany({ where: { organization_id: orgId }});
    await prisma.branch.deleteMany({ where: { company_id: { in: [compAId, compBId].filter((id): id is string => !!id) } }});
    await prisma.company.deleteMany({ where: { id: { in: [compAId, compBId].filter((id): id is string => !!id) } }});
    if (orgId) await prisma.organization.deleteMany({ where: { id: orgId }});
    }
    
    if (fs.existsSync('test-image.jpg')) fs.unlinkSync('test-image.jpg');
    if (fs.existsSync('test-image.txt')) fs.unlinkSync('test-image.txt');
    if (app) await app.close();
  });

  let attachmentId: string;

  it('should reject invalid mime type', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/attachments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-company-id', compAId)
      .set('x-branch-id', branchId)
      .field('entityType', 'PURCHASE')
      .field('entityId', uuidv4())
      .field('category', 'PURCHASE_BILL')
      .attach('file', 'test-image.txt', { contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Unsupported file type');
  });

  it('should successfully upload an image', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/attachments')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-company-id', compAId)
      .set('x-branch-id', branchId)
      .field('entityType', 'PURCHASE')
      .field('entityId', uuidv4())
      .field('category', 'PURCHASE_BILL')
      .attach('file', 'test-image.jpg', { contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.mimeType).toBe('image/jpeg');
    
    attachmentId = res.body.id;
  });

  it('should retrieve the attachment', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/attachments/${attachmentId}/content`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-company-id', compAId);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.body.toString()).toBe('dummy image content');
  });

  it('should prevent cross-tenant access', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/attachments/${attachmentId}/content`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-company-id', compBId); // using B's valid scope, trying to fetch A's attachment

    expect(res.status).toBe(404);
  });

  it('should delete the attachment and physical file', async () => {
    const dbFile = await prisma.attachment.findUnique({ where: { id: attachmentId }});
    const key = dbFile!.storage_key;
    const uploadDir = path.join(process.cwd(), 'storage');
    const fullPath = path.join(uploadDir, key);
    
    expect(fs.existsSync(fullPath)).toBe(true);

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/attachments/${attachmentId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-company-id', compAId);

    expect(res.status).toBe(200);

    // Verify DB
    const checkDb = await prisma.attachment.findUnique({ where: { id: attachmentId }});
    expect(checkDb).toBeNull();

    // Verify physical file is gone
    expect(fs.existsSync(fullPath)).toBe(false);
  });
});
