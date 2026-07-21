import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentAdmin } from '../auth/current-admin.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedAdmin } from '../auth/types';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { DisableAdminUserDto } from './dto/disable-admin-user.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin-users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Roles('manager', 'owner')
  @Get()
  getAdminUsers() {
    return this.adminUsersService.listAdminUsers();
  }

  @Get('me')
  getMe(@CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.adminUsersService.getCurrentAdmin(admin.id);
  }

  @Roles('owner')
  @Post()
  createAdminUser(
    @Body() dto: CreateAdminUserDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.adminUsersService.createAdminUser(dto, admin.id);
  }

  @Roles('owner')
  @Patch(':id/disable')
  disableAdminUser(
    @Param('id') id: string,
    @Body() dto: DisableAdminUserDto,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.adminUsersService.disableAdminUser(id, admin.id, dto.reason);
  }
}
