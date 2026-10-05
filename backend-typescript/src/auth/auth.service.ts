import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.bootstrapAdminUser();
  }

  async bootstrapAdminUser() {
    // Check if the admin user exists
    let admin = await this.prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!admin) {
      console.log('Bootstrapping default admin user...');
      const hashedPassword = await bcrypt.hash('Evolix@2026', 10);
      
      const org = await this.prisma.organization.upsert({
        where: { code: 'DEFAULT' },
        update: {},
        create: {
          name: 'Default Organization',
          code: 'DEFAULT',
          is_active: true,
        }
      });

      const company = await this.prisma.company.upsert({
        where: { uix_companies_org_code: { organization_id: org.id, code: 'DEF-COMP' } },
        update: {},
        create: {
          organization_id: org.id,
          code: 'DEF-COMP',
          legal_name: 'Default Company Ltd',
          trade_name: 'Default Company',
          gstin: 'GSTIN1234567890',
        }
      });

      const branch = await this.prisma.branch.upsert({
        where: { uix_branches_company_code: { company_id: company.id, code: 'HQ' } },
        update: {},
        create: {
          company_id: company.id,
          name: 'Main Branch',
          code: 'HQ',
        }
      });

      const role = await this.prisma.role.upsert({
        where: { uix_roles_org_name: { organization_id: org.id, name: 'ADMIN' } },
        update: {},
        create: {
          organization_id: org.id,
          name: 'ADMIN',
          description: 'Administrator',
          system_role: true,
        }
      });

      // Give admin all permissions
      const allPermissions = [
        'sales.read', 'sales.write', 'purchase.read', 'purchase.write', 
        'inventory.read', 'inventory.write', 'accounting.read', 'accounting.write'
      ];
      
      for (const p of allPermissions) {
        await this.prisma.permission.upsert({
          where: { code: p },
          update: {},
          create: {
            code: p,
            description: p,
            module: p.split('.')[0],
            resource: p.split('.')[0],
            action: p.split('.')[1]
          }
        });

        const perm = await this.prisma.permission.findUnique({ where: { code: p } });
        if (perm) {
          await this.prisma.rolePermission.upsert({
            where: { role_id_permission_id: { role_id: role.id, permission_id: perm.id } },
            update: {},
            create: {
              role_id: role.id,
              permission_id: perm.id,
              scope: 'ALL_COMPANIES'
            }
          });
        }
      }

      // Create User
      const adminUser = await this.prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
          organization_id: org.id,
          username: 'admin',
          password_hash: hashedPassword,
          display_name: 'System Administrator',
          is_active: true,
        }
      });

      await this.prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: adminUser.id, role_id: role.id } },
        update: {},
        create: {
          user_id: adminUser.id,
          role_id: role.id,
          company_id: company.id,
          branch_id: branch.id,
        }
      });

      console.log('Bootstrap completed. Admin user created.');
    }
  }

  async login(username: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        roles: {
          include: { role: { include: { role_permissions: { include: { permission: true } } } } }
        }
      }
    });

    const activeRole = userWithRoles?.roles[0]?.role;
    const permissions = activeRole?.role_permissions.map(rp => rp.permission.code) || [];

    const payload = { sub: user.id, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.display_name,
        role: activeRole?.name || 'USER',
        permissions: permissions
      }
    };
  }
}
