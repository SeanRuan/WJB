import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminUiModule } from './admin-ui/admin-ui.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { GuildApprovalsModule } from './guild-approvals/guild-approvals.module';
import { HealthController } from './health/health.controller';
import { LegacyChangeModule } from './legacy-change/legacy-change.module';
import { PlayersModule } from './players/players.module';
import { PrismaModule } from './prisma/prisma.module';
import { RechargeOrdersModule } from './recharge-orders/recharge-orders.module';
import { RoomCardsModule } from './room-cards/room-cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    AdminUsersModule,
    AdminUiModule,
    DashboardModule,
    GuildApprovalsModule,
    PlayersModule,
    AuditModule,
    LegacyChangeModule,
    RechargeOrdersModule,
    RoomCardsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
