import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { CreateGuildApprovalRequestDto } from './dto/create-guild-approval-request.dto';
import { ReviewGuildApprovalRequestDto } from './dto/review-guild-approval-request.dto';
import { GuildApprovalsService } from './guild-approvals.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guild-approvals')
export class GuildApprovalsController {
  constructor(private readonly guildApprovalsService: GuildApprovalsService) {}

  @Roles('support', 'manager', 'owner')
  @Get()
  getRequests(
    @Query('status') status?: string,
    @Query('requestType') requestType?: string,
    @Query('take') take?: string,
  ) {
    return this.guildApprovalsService.listRequests({
      status,
      requestType,
      take: take ? Number(take) : undefined,
    });
  }

  @Roles('support', 'manager', 'owner')
  @Post()
  createRequest(
    @Body() dto: CreateGuildApprovalRequestDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.createRequest(dto, admin.id);
  }

  @Roles('manager', 'owner')
  @Post(':id/approve')
  approveRequest(
    @Param('id') id: string,
    @Body() dto: ReviewGuildApprovalRequestDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.approveRequest(id, dto, admin.id);
  }

  @Roles('manager', 'owner')
  @Post(':id/reject')
  rejectRequest(
    @Param('id') id: string,
    @Body() dto: ReviewGuildApprovalRequestDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.rejectRequest(id, dto, admin.id);
  }
}
