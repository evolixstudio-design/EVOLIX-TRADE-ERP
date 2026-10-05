import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';

@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() signInDto: Record<string, any>) {
    return this.platformAuthService.login(signInDto.username, signInDto.password);
  }
}
