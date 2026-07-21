import { Controller, Get, Query } from '@nestjs/common';

import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAuditLogs(
    @Query('entityName') entityName?: string,
    @Query('action') action?: string,
    @Query('adminUserId') adminUserId?: string,
    @Query('playerId') playerId?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('take') take?: string,
  ) {
    return this.auditService.listAuditLogs({
      entityName,
      action,
      adminUserId,
      playerId,
      createdFrom,
      createdTo,
      take: take ? Number(take) : undefined,
    });
  }
}
