import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RechargeOrdersController } from './recharge-orders.controller';
import { RechargeOrdersService } from './recharge-orders.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RechargeOrdersController],
  providers: [RechargeOrdersService],
})
export class RechargeOrdersModule {}
