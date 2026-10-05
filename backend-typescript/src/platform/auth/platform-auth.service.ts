import { Injectable, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PlatformAuthService implements OnModuleInit {
  private readonly logger = new Logger(PlatformAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit() {
    await this.bootstrapSuperAdmin();
  }

  private async bootstrapSuperAdmin() {
    try {
      const superAdminRole = await this.prisma.platformRole.upsert({
        where: { name: 'SUPER_ADMIN' },
        update: {},
        create: {
          name: 'SUPER_ADMIN',
          description: 'Master platform administrator',
          system_role: true,
        }
      });

      const existingAdmin = await this.prisma.platformUser.findUnique({
        where: { username: 'superadmin' }
      });

      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('superadmin123', 10);
        const admin = await this.prisma.platformUser.create({
          data: {
            username: 'superadmin',
            display_name: 'Super Admin',
            password_hash: passwordHash,
            roles: {
              create: [
                { role_id: superAdminRole.id }
              ]
            }
          }
        });
        this.logger.log(`Bootstrap completed. Platform Super Admin user created: ${admin.username}`);
      }
    } catch (e) {
      this.logger.error('Failed to bootstrap Platform Super Admin', e);
    }
  }

  async login(username: string, password: string):Promise<{access_token: string, user: any}> {
    const user = await this.prisma.platformUser.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } }
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      is_platform: true,
      roles: user.roles.map(r => r.role.name)
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.display_name,
        is_platform: true
      }
    };
  }
}
