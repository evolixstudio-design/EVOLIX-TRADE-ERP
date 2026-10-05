import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

export interface ProvisionTenantDto {
  organizationName: string;
  organizationCode: string;
  companyName: string;
  companyCode: string;
  branchName: string;
  branchCode: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
  planId?: string;
}

export interface InviteOwnerDto {
  organizationId: string;
  email: string;
  name: string;
}

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provisionTenant(dto: ProvisionTenantDto) {
    const existingOrg = await this.prisma.organization.findUnique({
      where: { code: dto.organizationCode }
    });
    if (existingOrg) throw new ConflictException(`Organization code ${dto.organizationCode} is already taken`);

    const existingUser = await this.prisma.user.findUnique({
      where: { username: dto.adminEmail }
    });
    if (existingUser) throw new ConflictException(`User email ${dto.adminEmail} is already taken`);

    // Fetch or create a default plan
    let planId = dto.planId;
    if (!planId) {
      const defaultPlan = await this.prisma.plan.upsert({
        where: { code: 'DEFAULT' },
        update: {},
        create: {
          code: 'DEFAULT',
          name: 'Default Plan',
        }
      });
      planId = defaultPlan.id;
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Create Organization
        const org = await tx.organization.create({
          data: {
            name: dto.organizationName,
            code: dto.organizationCode,
            plan_id: planId,
            status: 'ACTIVE'
          }
        });

        // 2. Create Company
        const company = await tx.company.create({
          data: {
            organization_id: org.id,
            trade_name: dto.companyName,
            code: dto.companyCode,
            legal_name: dto.companyName,
          }
        });

        // 3. Create Branch
        const branch = await tx.branch.create({
          data: {
            company_id: company.id,
            name: dto.branchName,
            code: dto.branchCode,
          }
        });

        // 4. Create Role (Tenant Admin)
        const role = await tx.role.create({
          data: {
            name: 'TENANT_ADMIN',
            description: 'Tenant Administrator',
            organization_id: org.id,
            system_role: false,
          }
        });

        // 5. Create Permissions for Role
        const permissionsList = ['INVENTORY_WRITE', 'SALES_WRITE', 'PURCHASE_WRITE', 'ACCOUNTING_WRITE', 'USER_MANAGEMENT'];
        
        for (const code of permissionsList) {
          const perm = await tx.permission.upsert({
            where: { code },
            update: {},
            create: {
              code,
              module: 'CORE',
              resource: 'ALL',
              action: 'ALL',
              description: code,
            }
          });
          await tx.rolePermission.create({
            data: {
              role_id: role.id,
              permission_id: perm.id
            }
          });
        }

        // 6. Create Admin User
        const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
        const user = await tx.user.create({
          data: {
            email: dto.adminEmail,
            username: dto.adminEmail,
            display_name: dto.adminName,
            password_hash: passwordHash,
            organization_id: org.id,
            roles: {
              create: [
                {
                  role_id: role.id,
                  company_id: company.id,
                  branch_id: branch.id
                }
              ]
            }
          }
        });

        return {
          organization: org,
          company: company,
          branch: branch,
          user: user
        };
      }, {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });

      this.logger.log(`Successfully provisioned tenant ${dto.organizationCode}`);
      return result;
    } catch (e: any) {
      this.logger.error(`Tenant provisioning failed: ${e.message}`, e.stack);
      throw e;
    }
  }

  async inviteOwner(dto: InviteOwnerDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId }
    });
    if (!org) throw new NotFoundException('Organization not found');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Expires in 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await this.prisma.ownerInvitation.create({
      data: {
        organization_id: org.id,
        email: dto.email,
        name: dto.name,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

    // In a real system, send email here
    this.logger.log(`Created invitation for ${dto.email} (token: ${token})`);

    return { message: 'Invitation created successfully', token }; // return token for testing/display
  }
}
