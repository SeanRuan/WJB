import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { ReviewRechargeOrderDto } from './dto/review-recharge-order.dto';
import { SubmitRechargeOrderDto } from './dto/submit-recharge-order.dto';
import { RechargeOrdersService } from './recharge-orders.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recharge-orders')
export class RechargeOrdersController {
  constructor(
    private readonly rechargeOrdersService: RechargeOrdersService,
  ) {}

  @Get()
  getRechargeOrders(
    @Query('status') status?: string,
    @Query('playerId') playerId?: string,
    @Query('take') take?: string,
  ) {
    return this.rechargeOrdersService.listRechargeOrders({
      status,
      playerId,
      take: take ? Number(take) : undefined,
    });
  }

  // 客服/會計登記核帳資料，狀態為 pending，此時尚未加房卡。
  @Roles('support', 'manager', 'owner')
  @Post()
  submitRechargeOrder(
    @Body() dto: SubmitRechargeOrderDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.rechargeOrdersService.submitRechargeOrder(dto, admin.id);
  }

  // manager 以上核准，才真正加房卡並產生 RoomCardLog。
  @Roles('manager', 'owner')
  @Post(':id/confirm')
  confirmRechargeOrder(
    @Param('id') id: string,
    @Body() dto: ReviewRechargeOrderDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.rechargeOrdersService.confirmRechargeOrder(
      id,
      dto,
      admin.id,
    );
  }

  // manager 以上核駁，不套用任何房卡異動。
  @Roles('manager', 'owner')
  @Post(':id/reject')
  rejectRechargeOrder(
    @Param('id') id: string,
    @Body() dto: ReviewRechargeOrderDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.rechargeOrdersService.rejectRechargeOrder(id, dto, admin.id);
  }
}
