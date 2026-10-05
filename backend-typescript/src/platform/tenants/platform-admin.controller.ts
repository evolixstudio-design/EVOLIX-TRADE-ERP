import { Controller, Post, Body, Get, UseGuards, Param, Patch } from '@nestjs/common';
import { PlatformAuthGuard } from '../auth/platform-auth.guard';
import { TenantProvisioningService, ProvisionTenantDto } from '../provisioning/tenant-provisioning.service';
import { PrismaService } from '../../database/prisma.service';

@UseGuards(PlatformAuthGuard)
@Controller('platform/admin')
export class PlatformAdminController {
  constructor(
    private readonly provisioningService: TenantProvisioningService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('tenants')
  async provisionTenant(@Body() dto: ProvisionTenantDto) {
    return this.provisioningService.provisionTenant(dto);
  }

  @Post('tenants/:id/invite')
  async inviteOwner(
    @Param('id') id: string,
    @Body() dto: { email: string; name: string }
  ) {
    return this.provisioningService.inviteOwner({
      organizationId: id,
      email: dto.email,
      name: dto.name
    });
  }

  @Get('tenants')
  async listTenants() {
    return this.prisma.organization.findMany({
      include: {
        plan: true,
        companies: true,
      }
    });
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        plan: true,
        companies: {
          include: {
            branches: true
          }
        }
      }
    });
  }

  @Patch('tenants/:id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
  ) {
    return this.prisma.organization.update({
      where: { id },
      data: { status }
    });
  }
}
