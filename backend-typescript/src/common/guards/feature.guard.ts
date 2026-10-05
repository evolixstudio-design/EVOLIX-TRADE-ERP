import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';

export const FEATURES_KEY = 'features';
export const RequireFeature = (...features: string[]) => SetMetadata(FEATURES_KEY, features);

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true; // No specific features required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organization_id) {
      throw new ForbiddenException('Missing organization context for feature entitlement check');
    }

    // Check entitlements for the requested features
    const entitlements = await this.prisma.tenantEntitlement.findMany({
      where: {
        organization_id: user.organization_id,
        is_enabled: true,
        feature: {
          code: {
            in: requiredFeatures
          },
          is_active: true
        }
      },
      include: {
        feature: true
      }
    });

    const activeFeatureCodes = entitlements.map(e => e.feature.code);

    const hasAllRequiredFeatures = requiredFeatures.every(f => activeFeatureCodes.includes(f));

    if (!hasAllRequiredFeatures) {
      const missingFeatures = requiredFeatures.filter(f => !activeFeatureCodes.includes(f));
      throw new ForbiddenException(`Organization lacks entitlement for features: ${missingFeatures.join(', ')}`);
    }

    return true;
  }
}
