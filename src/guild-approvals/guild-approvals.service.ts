import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { listMockAdminUsers } from '../auth/mock-admin-users';
import { findMockPlayerById } from '../players/mock-players';
import { PrismaService } from '../prisma/prisma.service';
import { AddGuildMemberDto } from './dto/add-guild-member.dto';
import { CreateGuildApprovalRequestDto } from './dto/create-guild-approval-request.dto';
import { RemoveGuildMemberDto } from './dto/remove-guild-member.dto';
import { ReviewGuildApprovalRequestDto } from './dto/review-guild-approval-request.dto';
import { UpdateGuildMemberRoleDto } from './dto/update-guild-member-role.dto';

type RequestType = 'create_guild' | 'update_reference_rate' | 'revoke_guild';

type ListRequestsOptions = {
  status?: string;
  requestType?: string;
  take?: number;
};

type ListGuildsOptions = {
  status?: string;
  search?: string;
  playerId?: string;
  take?: number;
};

type CreatePayload = {
  name: string;
  selfTouchReferenceRate: number;
  selfTouchReferenceVisible: boolean;
  winReferenceRate: number;
  winReferenceVisible: boolean;
};

type UpdatePayload = {
  name?: string;
  selfTouchReferenceRate?: number;
  selfTouchReferenceVisible?: boolean;
  winReferenceRate?: number;
  winReferenceVisible?: boolean;
};

@Injectable()
export class GuildApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listRequests(options: ListRequestsOptions) {
    const take = clampTake(options.take);
    const status = options.status?.trim();
    const requestType = options.requestType?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockGuildApprovalRequests({ status, requestType, take });
    }

    return this.prisma.guildApprovalRequest.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(requestType ? { requestType } : {}),
      },
      include: {
        requestedByAdmin: {
          select: { id: true, email: true, displayName: true, role: true },
        },
        reviewedByAdmin: {
          select: { id: true, email: true, displayName: true, role: true },
        },
        guild: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async createRequest(dto: CreateGuildApprovalRequestDto, adminId: string) {
    const requestType = parseRequestType(dto.requestType);
    validateRequestGuildId(requestType, dto.guildId);

    if (process.env.DATA_SOURCE === 'mock') {
      if (requestType !== 'create_guild') {
        const guild = findMockGuildById(dto.guildId!);
        if (!guild) {
          throw new NotFoundException(`Guild ${dto.guildId} not found`);
        }
      }

      validatePayload(requestType, dto.payload);

      const created = createMockGuildApprovalRequest(requestType, dto.guildId, dto.payload, adminId);

      await this.auditService.recordAuditLog({
        action: 'SUBMIT_GUILD_APPROVAL_REQUEST',
        entityName: 'GuildApprovalRequest',
        entityId: created.id,
        summary: `送出公會異動申請（${requestType}）`,
        metadata: {
          requestType,
          guildId: created.guildId,
          requestPayload: dto.payload,
        },
        adminUserId: adminId,
      });

      return created;
    }

    if (requestType !== 'create_guild') {
      const guild = await this.prisma.guild.findUnique({
        where: { id: dto.guildId! },
        select: { id: true },
      });

      if (!guild) {
        throw new NotFoundException(`Guild ${dto.guildId} not found`);
      }
    }

    validatePayload(requestType, dto.payload);

    const created = await this.prisma.guildApprovalRequest.create({
      data: {
        requestType,
        guildId: requestType === 'create_guild' ? null : dto.guildId!,
        payload: JSON.stringify(dto.payload),
        requestedByAdminId: adminId,
      },
    });

    await this.auditService.recordAuditLog({
      action: 'SUBMIT_GUILD_APPROVAL_REQUEST',
      entityName: 'GuildApprovalRequest',
      entityId: created.id,
      summary: `送出公會異動申請（${requestType}）`,
      metadata: {
        requestType,
        guildId: created.guildId,
        requestPayload: dto.payload,
      },
      adminUserId: adminId,
    });

    return created;
  }

  async approveRequest(
    id: string,
    dto: ReviewGuildApprovalRequestDto,
    adminId: string,
  ) {
    const reviewNote = String(dto.reviewNote || '').trim();
    if (!reviewNote) {
      throw new BadRequestException('公會申請審核需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const approved = approveMockGuildApprovalRequest(id, reviewNote, adminId);
      const requestPayload = parsePayload(approved.payload);

      await this.auditService.recordAuditLog({
        action: 'APPROVE_GUILD_APPROVAL_REQUEST',
        entityName: 'GuildApprovalRequest',
        entityId: approved.id,
        summary: `核准公會異動申請（${approved.requestType}）`,
        metadata: {
          requestType: approved.requestType,
          guildId: approved.guildId,
          requestPayload,
          reviewNote,
        },
        adminUserId: adminId,
      });

      return approved;
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guildApprovalRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException(`Guild approval request ${id} not found`);
      }

      if (request.status !== 'pending') {
        throw new BadRequestException(`Request ${id} is already ${request.status}`);
      }

      const requestType = parseRequestType(request.requestType);
      const payload = parsePayload(request.payload);
      let appliedGuildId = request.guildId;

      if (requestType === 'create_guild') {
        const createPayload = toCreatePayload(payload);
        const createdGuild = await tx.guild.create({
          data: {
            name: createPayload.name,
            selfTouchReferenceRate: createPayload.selfTouchReferenceRate,
            selfTouchReferenceVisible: createPayload.selfTouchReferenceVisible,
            winReferenceRate: createPayload.winReferenceRate,
            winReferenceVisible: createPayload.winReferenceVisible,
            status: 'active',
            creationMethod: 'customer_service',
            createdByAdminId: adminId,
          },
          select: { id: true },
        });
        appliedGuildId = createdGuild.id;
      }

      if (requestType === 'update_reference_rate') {
        if (!request.guildId) {
          throw new BadRequestException('guildId is required for update request');
        }

        const updatePayload = toUpdatePayload(payload);
        if (Object.keys(updatePayload).length === 0) {
          throw new BadRequestException('No update fields provided in payload');
        }

        await tx.guild.update({
          where: { id: request.guildId },
          data: updatePayload,
        });
      }

      if (requestType === 'revoke_guild') {
        if (!request.guildId) {
          throw new BadRequestException('guildId is required for revoke request');
        }

        await tx.guild.update({
          where: { id: request.guildId },
          data: { status: 'revoked' },
        });
      }

      const approved = await tx.guildApprovalRequest.update({
        where: { id },
        data: {
          status: 'approved',
          guildId: appliedGuildId,
          reviewedByAdminId: adminId,
          reviewNote,
          reviewedAt: new Date(),
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'APPROVE_GUILD_APPROVAL_REQUEST',
          entityName: 'GuildApprovalRequest',
          entityId: approved.id,
          summary: `核准公會異動申請（${requestType}）`,
          metadata: {
            requestType,
            guildId: approved.guildId,
            requestPayload: payload,
            reviewNote,
          },
          adminUserId: adminId,
        },
        tx,
      );

      return approved;
    });
  }

  async rejectRequest(
    id: string,
    dto: ReviewGuildApprovalRequestDto,
    adminId: string,
  ) {
    const reviewNote = String(dto.reviewNote || '').trim();
    if (!reviewNote) {
      throw new BadRequestException('公會申請審核需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const rejected = rejectMockGuildApprovalRequest(id, reviewNote, adminId);

      await this.auditService.recordAuditLog({
        action: 'REJECT_GUILD_APPROVAL_REQUEST',
        entityName: 'GuildApprovalRequest',
        entityId: rejected.id,
        summary: `駁回公會異動申請（${rejected.requestType}）`,
        metadata: {
          requestType: rejected.requestType,
          guildId: rejected.guildId,
          requestPayload: parsePayload(rejected.payload),
          reviewNote,
        },
        adminUserId: adminId,
      });

      return rejected;
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guildApprovalRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException(`Guild approval request ${id} not found`);
      }

      if (request.status !== 'pending') {
        throw new BadRequestException(`Request ${id} is already ${request.status}`);
      }

      const rejected = await tx.guildApprovalRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedByAdminId: adminId,
          reviewNote,
          reviewedAt: new Date(),
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'REJECT_GUILD_APPROVAL_REQUEST',
          entityName: 'GuildApprovalRequest',
          entityId: rejected.id,
          summary: `駁回公會異動申請（${request.requestType}）`,
          metadata: {
            requestType: request.requestType,
            guildId: request.guildId,
            requestPayload: parsePayload(request.payload),
            reviewNote,
          },
          adminUserId: adminId,
        },
        tx,
      );

      return rejected;
    });
  }

  async listGuilds(options: ListGuildsOptions) {
    const take = clampTake(options.take);
    const status = options.status?.trim();
    const search = options.search?.trim();
    const playerId = options.playerId?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockGuilds({ status, search, playerId, take });
    }

    return this.prisma.guild.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { name: { contains: search } } : {}),
        ...(playerId
          ? {
              members: {
                some: {
                  playerId,
                  status: 'active',
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        name: true,
        status: true,
        selfTouchReferenceRate: true,
        selfTouchReferenceVisible: true,
        winReferenceRate: true,
        winReferenceVisible: true,
        creationMethod: true,
        createdByAdminId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async getGuild(id: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const guild = findMockGuildById(id);

      if (!guild) {
        throw new NotFoundException(`Guild ${id} not found`);
      }

      return guild;
    }

    const guild = await this.prisma.guild.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        selfTouchReferenceRate: true,
        selfTouchReferenceVisible: true,
        winReferenceRate: true,
        winReferenceVisible: true,
        creationMethod: true,
        createdByAdminId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { joinedAt: 'desc' },
          select: {
            id: true,
            playerId: true,
            role: true,
            status: true,
            joinedAt: true,
            player: {
              select: {
                externalId: true,
                nickname: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!guild) {
      throw new NotFoundException(`Guild ${id} not found`);
    }

    return guild;
  }

  async addGuildMember(
    guildId: string,
    dto: AddGuildMemberDto,
    adminId: string,
  ) {
    const role = dto.role ?? 'member';
    const note = String(dto.note || '').trim();
    if (!note) {
      throw new BadRequestException('加入公會成員需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const member = addMockGuildMember(guildId, dto.playerId, role, note, adminId);

      await this.auditService.recordAuditLog({
        action: 'ADD_GUILD_MEMBER',
        entityName: 'GuildMember',
        entityId: member.id,
        summary: '客服新增或恢復公會成員',
        metadata: {
          guildId,
          playerId: member.playerId,
          before: member.audit.before,
          after: member.audit.after,
          note,
        },
        adminUserId: adminId,
        playerId: member.playerId,
      });

      return {
        id: member.id,
        playerId: member.playerId,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        player: resolveMockPlayerSummary(member.playerId),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      await ensureGuildActive(tx, guildId);

      const player = await tx.player.findUnique({
        where: { id: dto.playerId },
        select: { id: true, externalId: true, nickname: true },
      });

      if (!player) {
        throw new NotFoundException(`Player ${dto.playerId} not found`);
      }

      const activeMembershipInOtherGuild = await tx.guildMember.findFirst({
        where: {
          playerId: dto.playerId,
          status: 'active',
          guildId: { not: guildId },
        },
        select: {
          id: true,
          guildId: true,
          guild: {
            select: { name: true },
          },
        },
      });

      if (activeMembershipInOtherGuild) {
        throw new BadRequestException(
          `Player is already active in guild ${activeMembershipInOtherGuild.guild.name}`,
        );
      }

      const existingMembership = await tx.guildMember.findUnique({
        where: {
          guildId_playerId: {
            guildId,
            playerId: dto.playerId,
          },
        },
        select: {
          id: true,
          role: true,
          status: true,
        },
      });

      const member = await tx.guildMember.upsert({
        where: {
          guildId_playerId: {
            guildId,
            playerId: dto.playerId,
          },
        },
        create: {
          guildId,
          playerId: dto.playerId,
          role,
          status: 'active',
        },
        update: {
          role,
          status: 'active',
        },
        include: {
          player: {
            select: { externalId: true, nickname: true, status: true },
          },
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'ADD_GUILD_MEMBER',
          entityName: 'GuildMember',
          entityId: member.id,
          summary: '客服新增或恢復公會成員',
          metadata: {
            guildId,
            playerId: member.playerId,
            before: existingMembership
              ? {
                  role: existingMembership.role,
                  status: existingMembership.status,
                }
              : null,
            after: {
              role: member.role,
              status: member.status,
            },
            note,
          },
          adminUserId: adminId,
          playerId: member.playerId,
        },
        tx,
      );

      return member;
    });
  }

  async updateGuildMemberRole(
    guildId: string,
    memberId: string,
    dto: UpdateGuildMemberRoleDto,
    adminId: string,
  ) {
    const note = String(dto.note || '').trim();
    if (!note) {
      throw new BadRequestException('調整公會成員角色需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const updated = updateMockGuildMemberRole(guildId, memberId, dto.role, note, adminId);

      await this.auditService.recordAuditLog({
        action: 'UPDATE_GUILD_MEMBER_ROLE',
        entityName: 'GuildMember',
        entityId: updated.id,
        summary: '客服調整公會成員角色',
        metadata: {
          guildId,
          playerId: updated.playerId,
          before: updated.audit.before,
          after: updated.audit.after,
          note,
        },
        adminUserId: adminId,
        playerId: updated.playerId,
      });

      return {
        id: updated.id,
        playerId: updated.playerId,
        role: updated.role,
        status: updated.status,
        joinedAt: updated.joinedAt,
        player: resolveMockPlayerSummary(updated.playerId),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      await ensureGuildActive(tx, guildId);

      const existing = await tx.guildMember.findFirst({
        where: { id: memberId, guildId },
        select: {
          id: true,
          playerId: true,
          role: true,
          status: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Guild member ${memberId} not found`);
      }

      if (existing.status !== 'active') {
        throw new BadRequestException(
          `Guild member ${memberId} is already ${existing.status}`,
        );
      }

      if (existing.role === dto.role) {
        return tx.guildMember.findUnique({
          where: { id: memberId },
          include: {
            player: {
              select: { externalId: true, nickname: true, status: true },
            },
          },
        });
      }

      const updated = await tx.guildMember.update({
        where: { id: memberId },
        data: { role: dto.role },
        include: {
          player: {
            select: { externalId: true, nickname: true, status: true },
          },
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'UPDATE_GUILD_MEMBER_ROLE',
          entityName: 'GuildMember',
          entityId: updated.id,
          summary: '客服調整公會成員角色',
          metadata: {
            guildId,
            playerId: updated.playerId,
            before: {
              role: existing.role,
              status: existing.status,
            },
            after: {
              role: updated.role,
              status: updated.status,
            },
            note,
          },
          adminUserId: adminId,
          playerId: updated.playerId,
        },
        tx,
      );

      return updated;
    });
  }

  async removeGuildMember(
    guildId: string,
    memberId: string,
    dto: RemoveGuildMemberDto,
    adminId: string,
  ) {
    const note = String(dto.note || '').trim();
    if (!note) {
      throw new BadRequestException('移出公會成員需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const removed = removeMockGuildMember(guildId, memberId, note, adminId);

      await this.auditService.recordAuditLog({
        action: 'REMOVE_GUILD_MEMBER',
        entityName: 'GuildMember',
        entityId: removed.id,
        summary: '客服移出公會成員',
        metadata: {
          guildId,
          playerId: removed.playerId,
          before: removed.audit.before,
          after: removed.audit.after,
          note,
        },
        adminUserId: adminId,
        playerId: removed.playerId,
      });

      return {
        id: removed.id,
        playerId: removed.playerId,
        role: removed.role,
        status: removed.status,
        joinedAt: removed.joinedAt,
        player: resolveMockPlayerSummary(removed.playerId),
      };
    }

    return this.prisma.$transaction(async (tx) => {
      await ensureGuildActive(tx, guildId);

      const existing = await tx.guildMember.findFirst({
        where: { id: memberId, guildId },
        select: {
          id: true,
          playerId: true,
          status: true,
          role: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Guild member ${memberId} not found`);
      }

      if (existing.status === 'removed') {
        throw new BadRequestException(`Guild member ${memberId} is already removed`);
      }

      const removed = await tx.guildMember.update({
        where: { id: memberId },
        data: {
          status: 'removed',
        },
        include: {
          player: {
            select: { externalId: true, nickname: true, status: true },
          },
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'REMOVE_GUILD_MEMBER',
          entityName: 'GuildMember',
          entityId: removed.id,
          summary: '客服移出公會成員',
          metadata: {
            guildId,
            playerId: removed.playerId,
            before: {
              role: existing.role,
              status: existing.status,
            },
            after: {
              role: removed.role,
              status: removed.status,
            },
            note,
          },
          adminUserId: adminId,
          playerId: removed.playerId,
        },
        tx,
      );

      return removed;
    });
  }
}

async function ensureGuildActive(
  tx: Prisma.TransactionClient,
  guildId: string,
) {
  const guild = await tx.guild.findUnique({
    where: { id: guildId },
    select: { id: true, status: true },
  });

  if (!guild) {
    throw new NotFoundException(`Guild ${guildId} not found`);
  }

  if (guild.status !== 'active') {
    throw new BadRequestException(`Guild ${guildId} is ${guild.status}`);
  }
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}

function parseRequestType(value: string): RequestType {
  if (value === 'create_guild' || value === 'update_reference_rate' || value === 'revoke_guild') {
    return value;
  }

  throw new BadRequestException(`Unsupported requestType: ${value}`);
}

function validateRequestGuildId(requestType: RequestType, guildId?: string) {
  if (requestType === 'create_guild' && guildId) {
    throw new BadRequestException('create_guild request must not include guildId');
  }

  if (requestType !== 'create_guild' && !guildId) {
    throw new BadRequestException(`${requestType} request requires guildId`);
  }
}

function validatePayload(requestType: RequestType, payload: Record<string, unknown>) {
  if (requestType === 'create_guild') {
    toCreatePayload(payload);
    return;
  }

  if (requestType === 'update_reference_rate') {
    toUpdatePayload(payload);
    return;
  }

  if (requestType === 'revoke_guild') {
    return;
  }
}

function parsePayload(payload: string) {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return parsed;
  } catch {
    throw new BadRequestException('Invalid request payload JSON');
  }
}

function toCreatePayload(payload: Record<string, unknown>): CreatePayload {
  const name = toNonEmptyString(payload.name, 'payload.name');

  return {
    name,
    selfTouchReferenceRate: toInt(payload.selfTouchReferenceRate, 0),
    selfTouchReferenceVisible: toBoolean(payload.selfTouchReferenceVisible, false),
    winReferenceRate: toInt(payload.winReferenceRate, 0),
    winReferenceVisible: toBoolean(payload.winReferenceVisible, false),
  };
}

function toUpdatePayload(payload: Record<string, unknown>): UpdatePayload {
  const result: UpdatePayload = {};

  if (payload.name !== undefined) {
    result.name = toNonEmptyString(payload.name, 'payload.name');
  }
  if (payload.selfTouchReferenceRate !== undefined) {
    result.selfTouchReferenceRate = toInt(payload.selfTouchReferenceRate, 0);
  }
  if (payload.selfTouchReferenceVisible !== undefined) {
    result.selfTouchReferenceVisible = toBoolean(payload.selfTouchReferenceVisible, false);
  }
  if (payload.winReferenceRate !== undefined) {
    result.winReferenceRate = toInt(payload.winReferenceRate, 0);
  }
  if (payload.winReferenceVisible !== undefined) {
    result.winReferenceVisible = toBoolean(payload.winReferenceVisible, false);
  }

  return result;
}

function toNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`${fieldName} must be a non-empty string`);
  }

  return value.trim();
}

function toBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException('Boolean field in payload has invalid type');
  }

  return value;
}

function toInt(value: unknown, defaultValue: number) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new BadRequestException('Integer field in payload has invalid type');
  }

  return value;
}

type MockGuildMember = {
  id: string;
  playerId: string;
  role: string;
  status: string;
  joinedAt: Date;
};

type MockGuild = {
  id: string;
  name: string;
  status: string;
  selfTouchReferenceRate: number;
  selfTouchReferenceVisible: boolean;
  winReferenceRate: number;
  winReferenceVisible: boolean;
  creationMethod: string;
  createdByAdminId: string;
  createdAt: Date;
  updatedAt: Date;
  members: MockGuildMember[];
};

type MockGuildApprovalRequest = {
  id: string;
  requestType: RequestType;
  guildId: string | null;
  payload: string;
  status: string;
  requestedByAdminId: string;
  reviewedByAdminId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

const MOCK_GUILDS: MockGuild[] = [
  {
    id: 'mock_guild_001',
    name: '青龍會',
    status: 'active',
    selfTouchReferenceRate: 2,
    selfTouchReferenceVisible: true,
    winReferenceRate: 3,
    winReferenceVisible: true,
    creationMethod: 'customer_service',
    createdByAdminId: 'mock_admin_owner_01',
    createdAt: new Date('2026-07-10T10:00:00.000Z'),
    updatedAt: new Date('2026-07-16T08:00:00.000Z'),
    members: [
      {
        id: 'mock_guild_member_001',
        playerId: 'mock_player_001',
        role: 'leader',
        status: 'active',
        joinedAt: new Date('2026-07-10T10:00:00.000Z'),
      },
      {
        id: 'mock_guild_member_002',
        playerId: 'mock_player_002',
        role: 'member',
        status: 'active',
        joinedAt: new Date('2026-07-11T09:00:00.000Z'),
      },
    ],
  },
  {
    id: 'mock_guild_002',
    name: '白虎盟',
    status: 'revoked',
    selfTouchReferenceRate: 1,
    selfTouchReferenceVisible: false,
    winReferenceRate: 2,
    winReferenceVisible: true,
    creationMethod: 'customer_service',
    createdByAdminId: 'mock_admin_manager_01',
    createdAt: new Date('2026-07-05T12:00:00.000Z'),
    updatedAt: new Date('2026-07-14T18:30:00.000Z'),
    members: [
      {
        id: 'mock_guild_member_003',
        playerId: 'mock_player_003',
        role: 'leader',
        status: 'removed',
        joinedAt: new Date('2026-07-05T12:00:00.000Z'),
      },
    ],
  },
];

const MOCK_GUILD_APPROVAL_REQUESTS: MockGuildApprovalRequest[] = [
  {
    id: 'mock_guild_request_001',
    requestType: 'create_guild',
    guildId: null,
    payload: JSON.stringify({
      name: '玄武堂',
      selfTouchReferenceRate: 1,
      selfTouchReferenceVisible: true,
      winReferenceRate: 2,
      winReferenceVisible: false,
    }),
    status: 'pending',
    requestedByAdminId: 'mock_admin_support_01',
    reviewedByAdminId: null,
    reviewNote: null,
    createdAt: new Date('2026-07-17T03:00:00.000Z'),
    reviewedAt: null,
  },
  {
    id: 'mock_guild_request_002',
    requestType: 'revoke_guild',
    guildId: 'mock_guild_002',
    payload: JSON.stringify({}),
    status: 'approved',
    requestedByAdminId: 'mock_admin_manager_01',
    reviewedByAdminId: 'mock_admin_owner_01',
    reviewNote: '已核准解散',
    createdAt: new Date('2026-07-14T09:00:00.000Z'),
    reviewedAt: new Date('2026-07-14T10:30:00.000Z'),
  },
];

function filterMockGuildApprovalRequests(options: {
  status?: string;
  requestType?: string;
  take: number;
}) {
  const admins = listMockAdminUsers().map((admin) => ({
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
  }));

  return MOCK_GUILD_APPROVAL_REQUESTS
    .filter((request) => (options.status ? request.status === options.status : true))
    .filter((request) => (options.requestType ? request.requestType === options.requestType : true))
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, options.take)
    .map((request) => ({
      ...request,
      requestedByAdmin:
        admins.find((admin) => admin.id === request.requestedByAdminId) ?? null,
      reviewedByAdmin:
        request.reviewedByAdminId
          ? admins.find((admin) => admin.id === request.reviewedByAdminId) ?? null
          : null,
      guild: request.guildId
        ? (() => {
            const guild = MOCK_GUILDS.find((entry) => entry.id === request.guildId);
            return guild
              ? { id: guild.id, name: guild.name, status: guild.status }
              : null;
          })()
        : null,
    }));
}

function filterMockGuilds(options: {
  status?: string;
  search?: string;
  playerId?: string;
  take: number;
}) {
  return MOCK_GUILDS
    .filter((guild) => (options.status ? guild.status === options.status : true))
    .filter((guild) =>
      options.search ? guild.name.toLowerCase().includes(options.search.toLowerCase()) : true,
    )
    .filter((guild) =>
      options.playerId
        ? guild.members.some(
            (member) => member.playerId === options.playerId && member.status === 'active',
          )
        : true,
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, options.take)
    .map((guild) => ({
      id: guild.id,
      name: guild.name,
      status: guild.status,
      selfTouchReferenceRate: guild.selfTouchReferenceRate,
      selfTouchReferenceVisible: guild.selfTouchReferenceVisible,
      winReferenceRate: guild.winReferenceRate,
      winReferenceVisible: guild.winReferenceVisible,
      creationMethod: guild.creationMethod,
      createdByAdminId: guild.createdByAdminId,
      createdAt: guild.createdAt,
      updatedAt: guild.updatedAt,
      _count: {
        members: guild.members.filter((member) => member.status === 'active').length,
      },
    }));
}

function resolveMockPlayerSummary(playerId: string) {
  const player = findMockPlayerById(playerId);
  if (!player) {
    return {
      externalId: playerId,
      nickname: playerId,
      status: 'unknown',
    };
  }

  return {
    externalId: player.externalId,
    nickname: player.nickname,
    status: player.status,
  };
}

function addMockGuildMember(
  guildId: string,
  playerId: string,
  role: string,
  note: string,
  adminId: string,
) {
  const guild = MOCK_GUILDS.find((entry) => entry.id === guildId);
  if (!guild) {
    throw new NotFoundException(`Guild ${guildId} not found`);
  }

  if (guild.status !== 'active') {
    throw new BadRequestException(`Guild ${guildId} is ${guild.status}`);
  }

  const player = findMockPlayerById(playerId);
  if (!player) {
    throw new NotFoundException(`Player ${playerId} not found`);
  }

  const activeMembershipInOtherGuild = MOCK_GUILDS
    .filter((entry) => entry.id !== guildId)
    .find((entry) => entry.members.some((member) => member.playerId === playerId && member.status === 'active'));

  if (activeMembershipInOtherGuild) {
    throw new BadRequestException(`Player is already active in guild ${activeMembershipInOtherGuild.name}`);
  }

  const existingMembership = guild.members.find((member) => member.playerId === playerId) ?? null;
  const now = new Date();

  if (existingMembership) {
    const before = {
      role: existingMembership.role,
      status: existingMembership.status,
    };

    existingMembership.role = role;
    existingMembership.status = 'active';
    guild.updatedAt = now;

    return {
      id: existingMembership.id,
      playerId: existingMembership.playerId,
      role: existingMembership.role,
      status: existingMembership.status,
      joinedAt: existingMembership.joinedAt,
      audit: {
        before,
        after: {
          role: existingMembership.role,
          status: existingMembership.status,
        },
        note,
        adminId,
      },
    };
  }

  const nextSequence =
    MOCK_GUILDS
      .flatMap((entry) => entry.members)
      .map((member) => Number((member.id.match(/(\d+)$/) || [])[1] || 0))
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  const nextId = `mock_guild_member_${String(nextSequence).padStart(3, '0')}`;
  const createdMember = {
    id: nextId,
    playerId,
    role,
    status: 'active',
    joinedAt: now,
  };

  guild.members.push(createdMember);
  guild.updatedAt = now;

  return {
    ...createdMember,
    audit: {
      before: null,
      after: {
        role: createdMember.role,
        status: createdMember.status,
      },
      note,
      adminId,
    },
  };
}

function updateMockGuildMemberRole(
  guildId: string,
  memberId: string,
  role: string,
  note: string,
  adminId: string,
) {
  const guild = MOCK_GUILDS.find((entry) => entry.id === guildId);
  if (!guild) {
    throw new NotFoundException(`Guild ${guildId} not found`);
  }

  if (guild.status !== 'active') {
    throw new BadRequestException(`Guild ${guildId} is ${guild.status}`);
  }

  const member = guild.members.find((entry) => entry.id === memberId);
  if (!member) {
    throw new NotFoundException(`Guild member ${memberId} not found`);
  }

  if (member.status !== 'active') {
    throw new BadRequestException(`Guild member ${memberId} is already ${member.status}`);
  }

  const before = {
    role: member.role,
    status: member.status,
  };

  member.role = role;
  guild.updatedAt = new Date();

  return {
    id: member.id,
    guildId,
    playerId: member.playerId,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
    audit: {
      before,
      after: {
        role: member.role,
        status: member.status,
      },
      note,
      adminId,
    },
  };
}

function removeMockGuildMember(
  guildId: string,
  memberId: string,
  note: string,
  adminId: string,
) {
  const guild = MOCK_GUILDS.find((entry) => entry.id === guildId);
  if (!guild) {
    throw new NotFoundException(`Guild ${guildId} not found`);
  }

  if (guild.status !== 'active') {
    throw new BadRequestException(`Guild ${guildId} is ${guild.status}`);
  }

  const member = guild.members.find((entry) => entry.id === memberId);
  if (!member) {
    throw new NotFoundException(`Guild member ${memberId} not found`);
  }

  if (member.status === 'removed') {
    throw new BadRequestException(`Guild member ${memberId} is already removed`);
  }

  const before = {
    role: member.role,
    status: member.status,
  };

  member.status = 'removed';
  guild.updatedAt = new Date();

  return {
    id: member.id,
    guildId,
    playerId: member.playerId,
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
    audit: {
      before,
      after: {
        role: member.role,
        status: member.status,
      },
      note,
      adminId,
    },
  };
}

function findMockGuildApprovalRequestOrThrow(id: string) {
  const request = MOCK_GUILD_APPROVAL_REQUESTS.find((entry) => entry.id === id);
  if (!request) {
    throw new NotFoundException(`Guild approval request ${id} not found`);
  }

  if (request.status !== 'pending') {
    throw new BadRequestException(`Request ${id} is already ${request.status}`);
  }

  return request;
}

function approveMockGuildApprovalRequest(id: string, reviewNote: string, adminId: string) {
  const request = findMockGuildApprovalRequestOrThrow(id);
  const requestType = parseRequestType(request.requestType);
  const payload = parsePayload(request.payload);
  let appliedGuildId = request.guildId;

  if (requestType === 'create_guild') {
    const createPayload = toCreatePayload(payload);
    const now = new Date();
    const nextId = `mock_guild_${String(MOCK_GUILDS.length + 1).padStart(3, '0')}`;

    MOCK_GUILDS.push({
      id: nextId,
      name: createPayload.name,
      status: 'active',
      selfTouchReferenceRate: createPayload.selfTouchReferenceRate,
      selfTouchReferenceVisible: createPayload.selfTouchReferenceVisible,
      winReferenceRate: createPayload.winReferenceRate,
      winReferenceVisible: createPayload.winReferenceVisible,
      creationMethod: 'customer_service',
      createdByAdminId: adminId,
      createdAt: now,
      updatedAt: now,
      members: [],
    });

    appliedGuildId = nextId;
  }

  if (requestType === 'update_reference_rate') {
    if (!request.guildId) {
      throw new BadRequestException('guildId is required for update request');
    }

    const guild = MOCK_GUILDS.find((entry) => entry.id === request.guildId);
    if (!guild) {
      throw new NotFoundException(`Guild ${request.guildId} not found`);
    }

    const updatePayload = toUpdatePayload(payload);
    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('No update fields provided in payload');
    }

    Object.assign(guild, updatePayload, { updatedAt: new Date() });
  }

  if (requestType === 'revoke_guild') {
    if (!request.guildId) {
      throw new BadRequestException('guildId is required for revoke request');
    }

    const guild = MOCK_GUILDS.find((entry) => entry.id === request.guildId);
    if (!guild) {
      throw new NotFoundException(`Guild ${request.guildId} not found`);
    }

    guild.status = 'revoked';
    guild.updatedAt = new Date();
  }

  request.status = 'approved';
  request.guildId = appliedGuildId;
  request.reviewedByAdminId = adminId;
  request.reviewNote = reviewNote;
  request.reviewedAt = new Date();

  return request;
}

function rejectMockGuildApprovalRequest(id: string, reviewNote: string, adminId: string) {
  const request = findMockGuildApprovalRequestOrThrow(id);
  request.status = 'rejected';
  request.reviewedByAdminId = adminId;
  request.reviewNote = reviewNote;
  request.reviewedAt = new Date();
  return request;
}

function createMockGuildApprovalRequest(
  requestType: RequestType,
  guildId: string | undefined,
  payload: Record<string, unknown>,
  adminId: string,
) {
  const now = new Date();
  const nextSequence =
    MOCK_GUILD_APPROVAL_REQUESTS
      .map((entry) => Number((entry.id.match(/(\d+)$/) || [])[1] || 0))
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  const nextId = `mock_guild_request_${String(nextSequence).padStart(3, '0')}`;

  const created: MockGuildApprovalRequest = {
    id: nextId,
    requestType,
    guildId: requestType === 'create_guild' ? null : guildId ?? null,
    payload: JSON.stringify(payload),
    status: 'pending',
    requestedByAdminId: adminId,
    reviewedByAdminId: null,
    reviewNote: null,
    createdAt: now,
    reviewedAt: null,
  };

  MOCK_GUILD_APPROVAL_REQUESTS.push(created);
  return created;
}

function findMockGuildById(id: string) {
  const guild = MOCK_GUILDS.find((entry) => entry.id === id);
  if (!guild) {
    return null;
  }

  return {
    id: guild.id,
    name: guild.name,
    status: guild.status,
    selfTouchReferenceRate: guild.selfTouchReferenceRate,
    selfTouchReferenceVisible: guild.selfTouchReferenceVisible,
    winReferenceRate: guild.winReferenceRate,
    winReferenceVisible: guild.winReferenceVisible,
    creationMethod: guild.creationMethod,
    createdByAdminId: guild.createdByAdminId,
    createdAt: guild.createdAt,
    updatedAt: guild.updatedAt,
    members: guild.members
      .slice()
      .sort((left, right) => right.joinedAt.getTime() - left.joinedAt.getTime())
      .map((member) => ({
        id: member.id,
        playerId: member.playerId,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        player: (() => {
          const player = findMockPlayerById(member.playerId);
          return player
            ? {
                externalId: player.externalId,
                nickname: player.nickname,
                status: player.status,
              }
            : {
                externalId: member.playerId,
                nickname: member.playerId,
                status: 'unknown',
              };
        })(),
      })),
  };
}
