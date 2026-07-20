import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LegacyChangeController } from './legacy-change.controller';
import { LegacyChangeService } from './legacy-change.service';

@Module({
  imports: [AuthModule],
  controllers: [LegacyChangeController],
  providers: [LegacyChangeService],
  exports: [LegacyChangeService],
})
export class LegacyChangeModule {}
