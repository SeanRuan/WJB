import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { GuildApprovalsController } from './guild-approvals.controller';
import { GuildApprovalsService } from './guild-approvals.service';
import { GuildsController } from './guilds.controller';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [GuildApprovalsController, GuildsController],
  providers: [GuildApprovalsService],
})
export class GuildApprovalsModule {}
