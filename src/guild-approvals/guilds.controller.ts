import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { AddGuildMemberDto } from './dto/add-guild-member.dto';
import { RemoveGuildMemberDto } from './dto/remove-guild-member.dto';
import { UpdateGuildMemberRoleDto } from './dto/update-guild-member-role.dto';
import { GuildApprovalsService } from './guild-approvals.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildApprovalsService: GuildApprovalsService) {}

  @Roles('support', 'manager', 'owner')
  @Get()
  getGuilds(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('playerId') playerId?: string,
    @Query('take') take?: string,
  ) {
    return this.guildApprovalsService.listGuilds({
      status,
      search,
      playerId,
      take: take ? Number(take) : undefined,
    });
  }

  @Roles('support', 'manager', 'owner')
  @Get(':id')
  getGuild(@Param('id') id: string) {
    return this.guildApprovalsService.getGuild(id);
  }

  @Roles('support', 'manager', 'owner')
  @Post(':id/members')
  addGuildMember(
    @Param('id') id: string,
    @Body() dto: AddGuildMemberDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.addGuildMember(id, dto, admin.id);
  }

  @Roles('support', 'manager', 'owner')
  @Patch(':id/members/:memberId/role')
  updateGuildMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateGuildMemberRoleDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.updateGuildMemberRole(
      id,
      memberId,
      dto,
      admin.id,
    );
  }

  @Roles('support', 'manager', 'owner')
  @Post(':id/members/:memberId/remove')
  removeGuildMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: RemoveGuildMemberDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.guildApprovalsService.removeGuildMember(id, memberId, dto, admin.id);
  }
}
