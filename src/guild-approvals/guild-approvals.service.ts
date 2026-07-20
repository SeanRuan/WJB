import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
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
          reviewNote: dto.reviewNote,
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
            reviewNote: dto.reviewNote,
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
          reviewNote: dto.reviewNote,
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
            reviewNote: dto.reviewNote,
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

    return this.prisma.guild.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { name: { contains: search } } : {}),
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
            role: member.role,
            status: member.status,
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
            role: updated.role,
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
            previousRole: existing.role,
            note: dto.note,
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
