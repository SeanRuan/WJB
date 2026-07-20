import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RoomCardsController } from './room-cards.controller';
import { RoomCardsService } from './room-cards.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [RoomCardsController],
  providers: [RoomCardsService],
})
export class RoomCardsModule {}
