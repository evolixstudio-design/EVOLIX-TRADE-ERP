import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { IntelligenceService } from './intelligence.service';
import { IntentResolverService } from './intent-resolver.service';
import { PrismaService } from '../database/prisma.service';

describe('IntelligenceService', () => {
  let service: IntelligenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligenceService,
        IntentResolverService,
        {
          provide: PrismaService,
          useValue: {
            purchaseOrder: { findMany: vi.fn().mockResolvedValue([]) },
            purchaseOrderLine: { findMany: vi.fn().mockResolvedValue([]) },
            purchaseInvoice: { findMany: vi.fn().mockResolvedValue([]) },
            goodsReceipt: { findMany: vi.fn().mockResolvedValue([]) },
            user: { findUnique: vi.fn().mockResolvedValue(null) }
          },
        },
      ],
    }).compile();

    service = module.get<IntelligenceService>(IntelligenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fallback to deterministic intent if asked for open purchase orders', async () => {
    const result = await service.ask({ question: 'Show me open purchase orders' }, { organizationId: 'test-org', userId: 'admin-1' });
    expect(result.intent).toBe('OPEN_PURCHASE_ORDERS');
    expect(result.success).toBe(true);
  });

  it('should return NOT_IMPLEMENTABLE_YET for sales today', async () => {
    const result = await service.ask({ question: 'What are sales today?' }, { organizationId: 'test-org', userId: 'admin-1' });
    expect(result.intent).toBe('SALES_TODAY');
    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_IMPLEMENTABLE_YET');
  });

  it('should return UNKNOWN for arbitrary text', async () => {
    const result = await service.ask({ question: 'What is the meaning of life?' }, { organizationId: 'test-org', userId: 'admin-1' });
    expect(result.intent).toBe('UNKNOWN');
    expect(result.success).toBe(false);
  });
});
