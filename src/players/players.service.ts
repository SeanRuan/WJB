import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';
import {
    findMockPlayerById,
    listMockPlayers,
    updateMockPlayerStatus,
} from './mock-players';

type ListPlayersOptions = {
  search?: string;
  status?: string;
  joined?: string;
  createdFrom?: string;
  createdTo?: string;
  take?: number;
};

type LegacyMemberAccountRow = {
  User_GUID: string;
  EMail: string | null;
  Game_Nick: string | null;
  Status: string | null;
  Gold: number | string | null;
  RoomCards: number | null;
  Create_Date: Date | null;
};

@Injectable()
export class PlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPlayers(options: ListPlayersOptions) {
    const take = clampTake(options.take);
    const search = options.search?.trim();
    const status = options.status?.trim();
    const createdRange = resolveCreatedDateRange(options);

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockPlayers({ search, status, createdRange, take }).map(serializePlayer);
    }

    try {
      const players = await this.prisma.player.findMany({
        where: {
          ...(status ? { status } : {}),
          ...(createdRange
            ? {
                createdAt: {
                  gte: createdRange.gte,
                  lt: createdRange.lt,
                },
              }
            : {}),
          ...(search
            ? {
                OR: [
                  { externalId: { contains: search } },
                  { nickname: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          coinBalance: true,
          createdAt: true,
          updatedAt: true,
          roomCardBalance: {
            select: {
              balance: true,
            },
          },
        },
      });

      return players.map(serializePlayer);
    } catch {
      const rows = await this.prisma.$queryRaw<LegacyMemberAccountRow[]>`
        SELECT TOP (${take})
          [User_GUID],
          [EMail],
          [Game_Nick],
          [Status],
          [Gold],
          [RoomCards],
          [Create_Date]
        FROM [T_Member_Account]
        WHERE (
          ${search || ''} = '' OR
          [EMail] LIKE '%' + ${search || ''} + '%' OR
          [Game_Nick] LIKE '%' + ${search || ''} + '%'
        )
        AND (
          ${status || ''} = '' OR
          [Status] = ${mapStatusToLegacyStatus(status || '')}
        )
        AND (
          ${createdRange?.gte ?? null} IS NULL OR
          [Create_Date] >= ${createdRange?.gte ?? null}
        )
        AND (
          ${createdRange?.lt ?? null} IS NULL OR
          [Create_Date] < ${createdRange?.lt ?? null}
        )
        ORDER BY [Create_Date] DESC
      `;

      return rows.map(mapLegacyPlayerRowToPlayerShape);
    }
  }

  async getPlayer(id: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const player = findMockPlayerById(id);

      if (!player) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      return serializePlayer(player);
    }

    try {
      const player = await this.prisma.player.findUnique({
        where: { id },
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          coinBalance: true,
          createdAt: true,
          updatedAt: true,
          roomCardBalance: {
            select: {
              balance: true,
            },
          },
        },
      });

      if (!player) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      return serializePlayer(player);
    } catch {
      const rows = await this.prisma.$queryRaw<LegacyMemberAccountRow[]>`
        SELECT TOP (1)
          [User_GUID],
          [EMail],
          [Game_Nick],
          [Status],
          [Gold],
          [RoomCards],
          [Create_Date]
        FROM [T_Member_Account]
        WHERE [User_GUID] = ${id}
      `;

      const row = rows[0];
      if (!row) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      return mapLegacyPlayerRowToPlayerShape(row);
    }
  }

  async updatePlayerStatus(
    id: string,
    dto: UpdatePlayerStatusDto,
    adminId: string,
  ) {
    if (process.env.DATA_SOURCE === 'mock') {
      const player = updateMockPlayerStatus(id, dto.status);

      if (!player) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER_STATUS',
        entityName: 'Player',
        entityId: player.id,
        summary: `玩家狀態更新為 ${player.status}`,
        metadata: {
          externalId: player.externalId,
          nickname: player.nickname,
          status: player.status,
        },
        adminUserId: adminId,
        playerId: player.id,
      });

      return serializePlayer(player);
    }

    try {
      const existing = await this.prisma.player.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      if (existing.status === dto.status) {
        return this.getPlayer(id);
      }

      const updatedPlayer = await this.prisma.player.update({
        where: { id },
        data: { status: dto.status },
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          coinBalance: true,
          createdAt: true,
          updatedAt: true,
          roomCardBalance: {
            select: {
              balance: true,
            },
          },
        },
      });

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER_STATUS',
        entityName: 'Player',
        entityId: updatedPlayer.id,
        summary: `玩家狀態更新為 ${updatedPlayer.status}`,
        metadata: {
          externalId: updatedPlayer.externalId,
          nickname: updatedPlayer.nickname,
          status: updatedPlayer.status,
        },
        adminUserId: adminId,
        playerId: updatedPlayer.id,
      });

      return serializePlayer(updatedPlayer);
    } catch {
      const rows = await this.prisma.$queryRaw<LegacyMemberAccountRow[]>`
        SELECT TOP (1)
          [User_GUID],
          [EMail],
          [Game_Nick],
          [Status],
          [Gold],
          [RoomCards],
          [Create_Date]
        FROM [T_Member_Account]
        WHERE [User_GUID] = ${id}
      `;

      const existing = rows[0];
      if (!existing) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      const nextLegacyStatus = mapStatusToLegacyStatus(dto.status);

      await this.prisma.$executeRaw`
        UPDATE [T_Member_Account]
        SET [Status] = ${nextLegacyStatus}
        WHERE [User_GUID] = ${id}
      `;

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER_STATUS',
        entityName: 'Player',
        entityId: existing.User_GUID,
        summary: `玩家狀態更新為 ${dto.status}`,
        metadata: {
          externalId: existing.EMail || existing.User_GUID,
          nickname: existing.Game_Nick || existing.User_GUID,
          status: dto.status,
          legacyStatus: nextLegacyStatus,
        },
        adminUserId: adminId,
        playerId: existing.User_GUID,
      });

      return this.getPlayer(id);
    }
  }
}

function mapLegacyPlayerRowToPlayerShape(row: LegacyMemberAccountRow) {
  const now = row.Create_Date || new Date();

  return {
    id: row.User_GUID,
    externalId: row.EMail || row.User_GUID,
    nickname: row.Game_Nick || row.User_GUID,
    status: mapLegacyStatusToStatus(row.Status),
    coinBalance: String(row.Gold ?? 0),
    createdAt: now,
    updatedAt: now,
    roomCardBalance: {
      balance: row.RoomCards ?? 0,
    },
  };
}

function mapLegacyStatusToStatus(status: string | null) {
  return status === 'N' ? 'banned' : 'active';
}

function mapStatusToLegacyStatus(status: string) {
  return status === 'banned' ? 'N' : 'Y';
}

function filterMockPlayers(options: {
  search?: string;
  status?: string;
  createdRange?: { gte: Date; lt: Date };
  take: number;
}) {
  const normalizedSearch = options.search?.toLowerCase();
  const normalizedStatus = options.status?.toLowerCase();

  const result = listMockPlayers().filter((player) => {
    const matchesSearch = normalizedSearch
      ? player.externalId.toLowerCase().includes(normalizedSearch) ||
        player.nickname.toLowerCase().includes(normalizedSearch)
      : true;
    const matchesStatus = normalizedStatus
      ? player.status.toLowerCase() === normalizedStatus
      : true;
    const matchesCreatedRange = options.createdRange
      ? player.createdAt >= options.createdRange.gte &&
        player.createdAt < options.createdRange.lt
      : true;

    return matchesSearch && matchesStatus && matchesCreatedRange;
  });

  return result
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, options.take);
}

function resolveCreatedDateRange(options: ListPlayersOptions) {
  const joined = options.joined?.trim().toLowerCase();

  if (joined === 'today') {
    return getUtcDayRange(new Date());
  }

  const from = parseIsoDate(options.createdFrom);
  const to = parseIsoDate(options.createdTo);

  if (!from && !to) {
    return undefined;
  }

  return {
    gte: from ?? new Date('1970-01-01T00:00:00.000Z'),
    lt: to ? addUtcDays(to, 1) : new Date('9999-12-31T00:00:00.000Z'),
  };
}

function parseIsoDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return undefined;
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function getUtcDayRange(base: Date) {
  const gte = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()),
  );

  return {
    gte,
    lt: addUtcDays(gte, 1),
  };
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}

function serializePlayer<T extends { coinBalance: bigint; [key: string]: unknown }>(
  player: T,
) {
  return {
    ...player,
    coinBalance: player.coinBalance.toString(),
  };
}
