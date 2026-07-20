import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'wujibackstage',
      stack: 'nestjs-prisma-sqlserver',
      appMode: process.env.APP_MODE,
      databaseAccessMode: process.env.DATABASE_ACCESS_MODE,
    };
  }
}