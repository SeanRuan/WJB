import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { LegacyChangeService } from './legacy-change.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legacy-change')
export class LegacyChangeController {
  constructor(private readonly legacyChangeService: LegacyChangeService) {}

  @Roles('support', 'manager', 'owner')
  @Get('snapshot')
  captureSnapshot(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.legacyChangeService.captureAndRecordSnapshot(admin.id);
  }

  @Roles('support', 'manager', 'owner')
  @Get('history')
  getHistory(@Query('take') take?: string) {
    const parsedTake = Number(take || 20);
    return this.legacyChangeService.getRecentHistory(parsedTake);
  }
}
