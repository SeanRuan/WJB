import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuditService } from '../audit/audit.service';
import {
    createMockAdminUser,
    disableMockAdminUser,
    findMockAdminById,
    listMockAdminUsers,
} from '../auth/mock-admin-users';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listAdminUsers() {
    if (process.env.DATA_SOURCE === 'mock') {
      return listMockAdminUsers().map(stripPasswordHash);
    }

    return this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getCurrentAdmin(adminId: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const admin = findMockAdminById(adminId);
      if (!admin) {
        throw new NotFoundException(`Admin user ${adminId} not found`);
      }

      return stripPasswordHash(admin);
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException(`Admin user ${adminId} not found`);
    }

    return admin;
  }

  async createAdminUser(dto: CreateAdminUserDto, actorAdminId: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const existingAdmin = listMockAdminUsers().find(
        (admin) => admin.email.toLowerCase() === dto.email.toLowerCase(),
      );

      if (existingAdmin) {
        throw new BadRequestException('Admin email already exists');
      }

      const newAdmin = createMockAdminUser(dto);

      await this.auditService.recordAuditLog({
        action: 'CREATE_ADMIN_USER',
        entityName: 'AdminUser',
        entityId: newAdmin.id,
        summary: '建立後台管理員帳號',
        metadata: {
          email: newAdmin.email,
          displayName: newAdmin.displayName,
          role: newAdmin.role,
          isActive: newAdmin.isActive,
        },
        adminUserId: actorAdminId,
      });

      return stripPasswordHash(newAdmin);
    }

    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    });

    if (existingAdmin) {
      throw new BadRequestException('Admin email already exists');
    }

    const newAdmin = await this.prisma.adminUser.create({
      data: {
        email: dto.email,
        displayName: dto.displayName,
        passwordHash: bcrypt.hashSync(dto.password, 10),
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.recordAuditLog({
      action: 'CREATE_ADMIN_USER',
      entityName: 'AdminUser',
      entityId: newAdmin.id,
      summary: '建立後台管理員帳號',
      metadata: {
        email: newAdmin.email,
        displayName: newAdmin.displayName,
        role: newAdmin.role,
        isActive: newAdmin.isActive,
      },
      adminUserId: actorAdminId,
    });

    return newAdmin;
  }

  async disableAdminUser(targetAdminId: string, actorAdminId: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const disabledAdmin = disableMockAdminUser(targetAdminId);

      if (!disabledAdmin) {
        throw new NotFoundException(`Admin user ${targetAdminId} not found`);
      }

      await this.auditService.recordAuditLog({
        action: 'DISABLE_ADMIN_USER',
        entityName: 'AdminUser',
        entityId: disabledAdmin.id,
        summary: '停用後台管理員帳號',
        metadata: {
          email: disabledAdmin.email,
          displayName: disabledAdmin.displayName,
          role: disabledAdmin.role,
          isActive: disabledAdmin.isActive,
        },
        adminUserId: actorAdminId,
      });

      return stripPasswordHash(disabledAdmin);
    }

    const targetAdmin = await this.prisma.adminUser.findUnique({
      where: { id: targetAdminId },
    });

    if (!targetAdmin) {
      throw new NotFoundException(`Admin user ${targetAdminId} not found`);
    }

    const disabledAdmin = await this.prisma.adminUser.update({
      where: { id: targetAdminId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditService.recordAuditLog({
      action: 'DISABLE_ADMIN_USER',
      entityName: 'AdminUser',
      entityId: disabledAdmin.id,
      summary: '停用後台管理員帳號',
      metadata: {
        email: disabledAdmin.email,
        displayName: disabledAdmin.displayName,
        role: disabledAdmin.role,
        isActive: disabledAdmin.isActive,
      },
      adminUserId: actorAdminId,
    });

    return disabledAdmin;
  }
}

function stripPasswordHash<T extends { passwordHash?: string }>(admin: T) {
  const { passwordHash: _passwordHash, ...rest } = admin;
  return rest;
}
