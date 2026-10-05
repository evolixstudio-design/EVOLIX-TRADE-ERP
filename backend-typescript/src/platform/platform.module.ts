import { Module } from '@nestjs/common';
import { PlatformAdminController } from './tenants/platform-admin.controller';
import { PlatformAuthModule } from './auth/platform-auth.module';
import { TenantProvisioningModule } from './provisioning/tenant-provisioning.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PlatformAuthModule,
    TenantProvisioningModule,
    ConfigModule
  ],
  controllers: [PlatformAdminController],
})
export class PlatformModule {}
