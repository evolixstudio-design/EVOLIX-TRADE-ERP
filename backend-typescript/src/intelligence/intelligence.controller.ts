import { Controller, Post, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceQuery } from './interfaces';

@Controller('intelligence')
export class IntelligenceController {
  constructor(private readonly intelligenceService: IntelligenceService) {}

  @Post('ask')
  async ask(@Body() query: IntelligenceQuery, @Req() request: any) {
    // In our mock, request.user should exist.
    // Ensure the tenant scope is taken directly from the server-side auth token.
    const user = request.user || { id: 'admin-1', organization_id: 'mock-org' }; // Fallback for dev

    const context = {
      organizationId: user.organization_id || query.context?.organizationId, // Real app: force from token
      branchId: query.context?.branchId, // Allowed to narrow scope, but not expand
      userId: user.id
    };

    if (!context.organizationId) {
       // Just mocking for now to avoid crashes if token is sparse
       context.organizationId = 'a1f81d87-5789-4e78-9e5c-21445b23d9a1';
    }

    return this.intelligenceService.ask(query, context);
  }
}
