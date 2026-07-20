import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
	imports: [AuthModule, AuditModule],
	controllers: [PlayersController],
	providers: [PlayersService],
})
export class PlayersModule {}
