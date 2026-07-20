import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { LegacyChangeModule } from '../legacy-change/legacy-change.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AuthModule, AuditModule, LegacyChangeModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
