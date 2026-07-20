import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';
import { PlayersService } from './players.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Roles('support', 'manager', 'owner')
  @Get()
  getPlayers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('joined') joined?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('take') take?: string,
  ) {
    return this.playersService.listPlayers({
      search,
      status,
      joined,
      createdFrom,
      createdTo,
      take: take ? Number(take) : undefined,
    });
  }

  @Roles('support', 'manager', 'owner')
  @Get(':id')
  getPlayer(@Param('id') id: string) {
    return this.playersService.getPlayer(id);
  }

  @Roles('manager', 'owner')
  @Patch(':id/status')
  updatePlayerStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePlayerStatusDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.playersService.updatePlayerStatus(id, dto, admin.id);
  }
}
