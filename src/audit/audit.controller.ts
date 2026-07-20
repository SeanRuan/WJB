import { Controller, Get, Query } from '@nestjs/common';

import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getAuditLogs(
    @Query('entityName') entityName?: string,
    @Query('take') take?: string,
  ) {
    return this.auditService.listAuditLogs({
      entityName,
      take: take ? Number(take) : undefined,
    });
  }
}