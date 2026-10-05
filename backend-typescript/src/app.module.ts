import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { PurchaseModule } from './purchase/purchase.module';
// Modules that will be added later
// import { AuthModule } from './auth/auth.module';
// import { IdentityModule } from './identity/identity.module';
// import { OrganizationModule } from './organization/organization.module';

import { IntelligenceModule } from './intelligence/intelligence.module';
import { AccountingModule } from './accounting/accounting.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';
import { PlatformModule } from './platform/platform.module';
import { PosModule } from './pos/pos.module';
import { ClaimsModule } from './claims/claims.module';
import { BarcodeModule } from './barcode/barcode.module';
import { PricingModule } from './pricing/pricing.module';
import { RetailModule } from './retail/retail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AccountingModule,
    InventoryModule,
    AuthModule,
    PlatformModule,
    PosModule,
    PricingModule,
    RetailModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
