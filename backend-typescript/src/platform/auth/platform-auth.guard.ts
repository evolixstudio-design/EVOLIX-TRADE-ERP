import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface PlatformRequest extends Request {
  user?: any;
  platformUser?: any;
}

@Injectable()
export class PlatformAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Missing platform authentication token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super-secret-key-123',
      });

      if (!payload.is_platform) {
        throw new UnauthorizedException('Token is not a platform token');
      }

      const user = await this.prisma.platformUser.findUnique({
        where: { id: payload.sub },
        include: { roles: { include: { role: true } } }
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid platform user');
      }

      request['user'] = payload;
      request['platformUser'] = user;
    } catch (e) {
      throw new UnauthorizedException('Invalid platform authentication token');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
