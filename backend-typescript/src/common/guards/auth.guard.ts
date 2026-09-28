import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const requestedCompanyId = request.headers['x-company-id'];
    const requestedBranchId = request.headers['x-branch-id'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'evolix-super-secret-key'
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.sub;

    // Fetch user and active roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Determine authorization context
    // We strictly validate requestedCompanyId against the user's actual memberships
    let authorizedRole = null;

    if (requestedCompanyId) {
      // Find role for this specific company
      authorizedRole = user.roles.find(r => r.company_id === requestedCompanyId);
      if (!authorizedRole) {
        throw new ForbiddenException('Access denied to this company');
      }
    } else {
      // Default to their first role if none requested
      authorizedRole = user.roles[0];
    }

    if (!authorizedRole) {
      throw new ForbiddenException('User has no assigned roles/companies');
    }

    // Validate Branch
    if (requestedBranchId && authorizedRole.branch_id && authorizedRole.branch_id !== requestedBranchId) {
      // If the role is branch-specific, they cannot access a different branch
      // (Unless we have logic for 'ALL_BRANCHES', but keeping it strict for now)
      throw new ForbiddenException('Access denied to this branch');
    }

    const activeCompanyId = authorizedRole.company_id;
    const activeBranchId = requestedBranchId || authorizedRole.branch_id; // Use requested if allowed, else default

    // Flatten permissions
    const permissions = new Set<string>();
    authorizedRole.role.role_permissions.forEach((rp: any) => {
      permissions.add(rp.permission.code);
    });

    // Inject secure server-side context
    request.user = { 
      id: user.id, 
      username: user.username, 
      role: authorizedRole.role.name, 
      name: user.display_name,
      company_id: activeCompanyId,
      branch_id: activeBranchId,
      permissions: Array.from(permissions)
    };

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Logged in, but no specific permissions required
    }

    const hasPermission = () => {
      if (request.user.role === 'ADMIN' || authorizedRole.role.system_role) return true;
      return requiredPermissions.some((perm) => request.user.permissions.includes(perm));
    };

    if (!hasPermission()) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
