import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { AdjustRoomCardBalanceDto } from './dto/adjust-room-card-balance.dto';
import { RoomCardsService } from './room-cards.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('room-cards')
export class RoomCardsController {
  constructor(private readonly roomCardsService: RoomCardsService) {}

  @Get('balances')
  getBalances(
    @Query('search') search?: string,
    @Query('playerId') playerId?: string,
    @Query('take') take?: string,
  ) {
    return this.roomCardsService.listBalances({
      search,
      playerId,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('logs')
  getLogs(
    @Query('search') search?: string,
    @Query('playerId') playerId?: string,
    @Query('sourceType') sourceType?: string,
    @Query('take') take?: string,
  ) {
    return this.roomCardsService.listLogs({
      search,
      playerId,
      sourceType,
      take: take ? Number(take) : undefined,
    });
  }

  // 手動調整房卡（需留稽核），manager 以上才能操作。
  @Roles('manager', 'owner')
  @Post('adjust')
  adjustBalance(
    @Body() dto: AdjustRoomCardBalanceDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.roomCardsService.adjustBalance(dto, admin.id);
  }
}
