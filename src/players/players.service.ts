import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import {
    createMockPlayer,
    findMockPlayerById,
    listMockPlayers,
    listMockReservedExternalIds,
    reserveMockExternalId,
    updateMockPlayer,
    updateMockPlayerStatus,
} from './mock-players';

type ListPlayersOptions = {
  search?: string;
  status?: string;
  joined?: string;
  createdFrom?: string;
  createdTo?: string;
  offset?: number;
  take?: number;
};

type PlayerListItem = {
  id: string;
  externalId: string;
  nickname: string;
  status: string;
  note: string | null;
  tags: string | null;
  coinBalance: string;
  createdAt: Date;
  updatedAt: Date;
  roomCardBalance: { balance: number } | null;
};

type ListPlayersResult = {
  items: PlayerListItem[];
  offset: number;
  take: number;
  total: number;
  hasMore: boolean;
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

type LegacyCountRow = {
  total: number | bigint;
};

type ExternalIdReservationRow = {
  externalId: string;
  firstPlayerId: string | null;
};

@Injectable()
export class PlayersService {
  private externalIdReservationsSynced = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPlayers(options: ListPlayersOptions) {
    const take = clampTake(options.take);
    const offset = clampOffset(options.offset);
    const search = options.search?.trim();
    const status = options.status?.trim();
    const createdRange = resolveCreatedDateRange(options);

    if (process.env.DATA_SOURCE === 'mock') {
      const players = filterMockPlayers({ search, status, createdRange });
      const items = players.slice(offset, offset + take).map(serializePlayer);

      return {
        items,
        offset,
        take,
        total: players.length,
        hasMore: offset + take < players.length,
      } satisfies ListPlayersResult;
    }

    try {
      const where = {
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
                { note: { contains: search } },
                { tags: { contains: search } },
              ],
            }
          : {}),
      };

      const total = await this.prisma.player.count({ where });
      const players = await this.prisma.player.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take,
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          note: true,
          tags: true,
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

      return {
        items: players.map(serializePlayer),
        offset,
        take,
        total,
        hasMore: offset + take < total,
      } satisfies ListPlayersResult;
    } catch {
      const countRows = await this.prisma.$queryRaw<LegacyCountRow[]>`
        SELECT COUNT(1) AS [total]
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
      `;

      const rows = await this.prisma.$queryRaw<LegacyMemberAccountRow[]>`
        SELECT
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
        OFFSET ${offset} ROWS
        FETCH NEXT ${take} ROWS ONLY
      `;

      const total = toSafeNumber(countRows[0]?.total ?? 0);

      return {
        items: rows.map(mapLegacyPlayerRowToPlayerShape),
        offset,
        take,
        total,
        hasMore: offset + take < total,
      } satisfies ListPlayersResult;
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
          note: true,
          tags: true,
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

  async createPlayer(dto: CreatePlayerDto, adminId: string) {
    const status = dto.status ?? 'active';
    const externalId = dto.externalId.trim();
    const nickname = dto.nickname.trim();
    const note = normalizeOptionalNullableText(dto.note);
    const tags = normalizeOptionalTags(dto.tags);
    const reason = String(dto.reason || '').trim();

    if (!reason) {
      throw new BadRequestException('新增會員需填寫原因');
    }

    await this.assertExternalIdIsAvailable(externalId);

    if (process.env.DATA_SOURCE === 'mock') {
      const player = createMockPlayer({
        externalId,
        nickname,
        status,
        note,
        tags,
      });

      reserveMockExternalId(externalId);

      await this.auditService.recordAuditLog({
        action: 'CREATE_PLAYER',
        entityName: 'Player',
        entityId: player.id,
        summary: `新增玩家 ${player.nickname}`,
        metadata: {
          reason,
          after: buildPlayerAuditSnapshot(player),
        },
        adminUserId: adminId,
        playerId: player.id,
      });

      return serializePlayer(player);
    }

    try {
      const player = await this.prisma.player.create({
        data: {
          externalId,
          nickname,
          status,
          note,
          tags,
          roomCardBalance: {
            create: {
              balance: 0,
            },
          },
        },
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          note: true,
          tags: true,
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

      await this.reserveExternalId(externalId, player.id, 'player');

      await this.auditService.recordAuditLog({
        action: 'CREATE_PLAYER',
        entityName: 'Player',
        entityId: player.id,
        summary: `新增玩家 ${player.nickname}`,
        metadata: {
          after: buildPlayerAuditSnapshot(player),
        },
        adminUserId: adminId,
        playerId: player.id,
      });

      return serializePlayer(player);
    } catch {
      const createdAt = new Date();
      const legacyStatus = mapStatusToLegacyStatus(status);
      const legacyPlayerId = `legacy_player_${createdAt.getTime()}`;

      await this.prisma.$executeRaw`
        INSERT INTO [T_Member_Account] (
          [User_GUID],
          [EMail],
          [Game_Nick],
          [Status],
          [Gold],
          [RoomCards],
          [Create_Date]
        ) VALUES (
          ${legacyPlayerId},
          ${externalId},
          ${nickname},
          ${legacyStatus},
          ${0},
          ${0},
          ${createdAt}
        )
      `;

      await this.reserveExternalId(externalId, legacyPlayerId, 'legacy');

      await this.auditService.recordAuditLog({
        action: 'CREATE_PLAYER',
        entityName: 'Player',
        entityId: legacyPlayerId,
        summary: `新增玩家 ${nickname}`,
        metadata: {
          reason,
          after: {
            externalId,
            nickname,
            status,
          },
          legacyStatus,
        },
        adminUserId: adminId,
        playerId: legacyPlayerId,
      });

      return this.getPlayer(legacyPlayerId);
    }
  }

  async updatePlayer(id: string, dto: UpdatePlayerDto, adminId: string) {
    const nextExternalId = dto.externalId?.trim();
    const nextNickname = dto.nickname?.trim();
    const nextStatus = dto.status?.trim();
    const nextNote = dto.note === undefined ? undefined : normalizeOptionalNullableText(dto.note);
    const nextTags = dto.tags === undefined ? undefined : normalizeOptionalTags(dto.tags);
    const reason = String(dto.reason || '').trim();

    if (!reason) {
      throw new BadRequestException('更新會員資料需填寫原因');
    }

    if (!nextExternalId && !nextNickname && !nextStatus && nextNote === undefined && nextTags === undefined) {
      return this.getPlayer(id);
    }

    if (process.env.DATA_SOURCE === 'mock') {
      await this.assertExternalIdIsAvailable(nextExternalId, id);
      const existingPlayer = findMockPlayerById(id);
      const before = existingPlayer ? buildPlayerAuditSnapshot(existingPlayer) : null;

      const player = updateMockPlayer(id, {
        externalId: nextExternalId,
        nickname: nextNickname,
        status: nextStatus,
        note: nextNote,
        tags: nextTags,
      });

      if (!player) {
        throw new NotFoundException(`Player ${id} not found`);
      }

      if (nextExternalId && nextExternalId !== before?.externalId) {
        reserveMockExternalId(nextExternalId);
      }

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER',
        entityName: 'Player',
        entityId: player.id,
        summary: `更新玩家 ${player.nickname}`,
        metadata: {
          reason,
          before,
          after: buildPlayerAuditSnapshot(player),
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
      const before = buildPlayerAuditSnapshot(existing);

      await this.assertExternalIdIsAvailable(nextExternalId, id);

      const player = await this.prisma.player.update({
        where: { id },
        data: {
          ...(nextExternalId ? { externalId: nextExternalId } : {}),
          ...(nextNickname ? { nickname: nextNickname } : {}),
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(nextNote !== undefined ? { note: nextNote } : {}),
          ...(nextTags !== undefined ? { tags: nextTags } : {}),
        },
        select: {
          id: true,
          externalId: true,
          nickname: true,
          status: true,
          note: true,
          tags: true,
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

      if (nextExternalId && nextExternalId !== existing.externalId) {
        await this.reserveExternalId(nextExternalId, player.id, 'player');
      }

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER',
        entityName: 'Player',
        entityId: player.id,
        summary: `更新玩家 ${player.nickname}`,
        metadata: {
          reason,
          before,
          after: buildPlayerAuditSnapshot(player),
        },
        adminUserId: adminId,
        playerId: player.id,
      });

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

      const existing = rows[0];
      if (!existing) {
        throw new NotFoundException(`Player ${id} not found`);
      }
      const before = buildLegacyPlayerAuditSnapshot(existing);

      await this.assertExternalIdIsAvailable(nextExternalId, id);

      const legacyStatus = nextStatus ? mapStatusToLegacyStatus(nextStatus) : existing.Status ?? 'Y';

      await this.prisma.$executeRaw`
        UPDATE [T_Member_Account]
        SET
          [EMail] = ${nextExternalId || existing.EMail || existing.User_GUID},
          [Game_Nick] = ${nextNickname || existing.Game_Nick || existing.User_GUID},
          [Status] = ${legacyStatus}
        WHERE [User_GUID] = ${id}
      `;

      if (nextExternalId && nextExternalId !== (existing.EMail || existing.User_GUID)) {
        await this.reserveExternalId(nextExternalId, existing.User_GUID, 'legacy');
      }

      await this.auditService.recordAuditLog({
        action: 'UPDATE_PLAYER',
        entityName: 'Player',
        entityId: existing.User_GUID,
        summary: `更新玩家 ${nextNickname || existing.Game_Nick || existing.User_GUID}`,
        metadata: {
          reason,
          before,
          after: {
            externalId: nextExternalId || existing.EMail || existing.User_GUID,
            nickname: nextNickname || existing.Game_Nick || existing.User_GUID,
            status: nextStatus || mapLegacyStatusToStatus(existing.Status),
          },
          legacyStatus,
        },
        adminUserId: adminId,
        playerId: existing.User_GUID,
      });

      return this.getPlayer(id);
    }
  }

  async updatePlayerStatus(
    id: string,
    dto: UpdatePlayerStatusDto,
    adminId: string,
  ) {
    const reason = String(dto.reason || '').trim();
    if (!reason) {
      throw new BadRequestException('變更會員狀態需填寫原因');
    }

    if (process.env.DATA_SOURCE === 'mock') {
      const existingPlayer = findMockPlayerById(id);
      const beforeStatus = existingPlayer?.status ?? null;
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
          reason,
          before: {
            externalId: player.externalId,
            nickname: player.nickname,
            status: beforeStatus,
          },
          after: {
            externalId: player.externalId,
            nickname: player.nickname,
            status: player.status,
          },
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
          note: true,
          tags: true,
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
          reason,
          before: {
            externalId: existing.externalId,
            nickname: existing.nickname,
            status: existing.status,
          },
          after: {
            externalId: updatedPlayer.externalId,
            nickname: updatedPlayer.nickname,
            status: updatedPlayer.status,
          },
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
      const before = buildLegacyPlayerAuditSnapshot(existing);

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
          reason,
          before,
          after: {
            externalId: existing.EMail || existing.User_GUID,
            nickname: existing.Game_Nick || existing.User_GUID,
            status: dto.status,
          },
          legacyStatus: nextLegacyStatus,
        },
        adminUserId: adminId,
        playerId: existing.User_GUID,
      });

      return this.getPlayer(id);
    }
  }

  private async assertExternalIdIsAvailable(externalId?: string, excludePlayerId?: string) {
    if (!externalId) {
      return;
    }

    const normalizedExternalId = externalId.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      const reservedExternalIds = new Set(listMockReservedExternalIds());
      const excludePlayer = excludePlayerId
        ? listMockPlayers().find((player) => player.id === excludePlayerId)
        : null;
      const canReuseForSamePlayer =
        excludePlayer != null && excludePlayer.externalId === normalizedExternalId;

      if (reservedExternalIds.has(normalizedExternalId) && !canReuseForSamePlayer) {
        throw new ConflictException(`外部編號 ${normalizedExternalId} 曾使用過，依規則不可回收`);
      }

      const duplicate = listMockPlayers().find(
        (player) => player.externalId === normalizedExternalId && player.id !== excludePlayerId,
      );

      if (duplicate) {
        throw new ConflictException(`外部編號 ${normalizedExternalId} 已存在`);
      }

      return;
    }

    await this.assertExternalIdNeverReused(normalizedExternalId, excludePlayerId);

    try {
      const existing = await this.prisma.player.findUnique({
        where: { externalId: normalizedExternalId },
        select: { id: true },
      });

      if (existing && existing.id !== excludePlayerId) {
        throw new ConflictException(`外部編號 ${normalizedExternalId} 已存在`);
      }

      return;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      const rows = await this.prisma.$queryRaw<LegacyMemberAccountRow[]>`
        SELECT TOP (1)
          [User_GUID],
          [EMail]
        FROM [T_Member_Account]
        WHERE [EMail] = ${normalizedExternalId}
      `;

      const duplicate = rows[0];
      if (duplicate && duplicate.User_GUID !== excludePlayerId) {
        throw new ConflictException(`外部編號 ${normalizedExternalId} 已存在`);
      }
    }
  }

  private async assertExternalIdNeverReused(
    externalId: string,
    excludePlayerId?: string,
  ) {
    try {
      await this.syncCurrentExternalIdsToReservations();

      const rows = await this.prisma.$queryRaw<ExternalIdReservationRow[]>`
        SELECT TOP (1)
          [ExternalId] AS [externalId],
          [FirstPlayerId] AS [firstPlayerId]
        FROM [ExternalIdReservation]
        WHERE [ExternalId] = ${externalId}
      `;

      const reservation = rows[0];
      if (!reservation) {
        return;
      }

      if (excludePlayerId && reservation.firstPlayerId === excludePlayerId) {
        return;
      }

      throw new ConflictException(`外部編號 ${externalId} 曾使用過，依規則不可回收`);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
    }
  }

  private async reserveExternalId(
    externalId: string,
    playerId: string,
    source: 'player' | 'legacy',
  ) {
    try {
      await this.ensureExternalIdReservationStore();

      await this.prisma.$executeRaw`
        IF NOT EXISTS (
          SELECT 1 FROM [ExternalIdReservation] WHERE [ExternalId] = ${externalId}
        )
        BEGIN
          INSERT INTO [ExternalIdReservation] (
            [ExternalId],
            [FirstPlayerId],
            [Source],
            [FirstSeenAt]
          )
          VALUES (
            ${externalId},
            ${playerId},
            ${source},
            SYSUTCDATETIME()
          )
        END
      `;
    } catch {
      // No-op: existing unique checks still protect active data.
    }
  }

  private async syncCurrentExternalIdsToReservations() {
    if (this.externalIdReservationsSynced) {
      return;
    }

    await this.ensureExternalIdReservationStore();

    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO [ExternalIdReservation] ([ExternalId], [FirstPlayerId], [Source], [FirstSeenAt])
        SELECT
          p.[externalId],
          p.[id],
          'player',
          p.[createdAt]
        FROM [Player] p
        WHERE p.[externalId] IS NOT NULL
          AND LTRIM(RTRIM(p.[externalId])) <> ''
          AND NOT EXISTS (
            SELECT 1 FROM [ExternalIdReservation] r WHERE r.[ExternalId] = p.[externalId]
          )
      `);
    } catch {
      // Ignore when Player table is unavailable in legacy fallback mode.
    }

    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO [ExternalIdReservation] ([ExternalId], [FirstPlayerId], [Source], [FirstSeenAt])
        SELECT
          m.[EMail],
          m.[User_GUID],
          'legacy',
          COALESCE(m.[Create_Date], SYSUTCDATETIME())
        FROM [T_Member_Account] m
        WHERE m.[EMail] IS NOT NULL
          AND LTRIM(RTRIM(m.[EMail])) <> ''
          AND NOT EXISTS (
            SELECT 1 FROM [ExternalIdReservation] r WHERE r.[ExternalId] = m.[EMail]
          )
      `);
    } catch {
      // Ignore when legacy table is unavailable in Prisma-first environments.
    }

    this.externalIdReservationsSynced = true;
  }

  private async ensureExternalIdReservationStore() {
    await this.prisma.$executeRawUnsafe(`
      IF OBJECT_ID(N'[ExternalIdReservation]', N'U') IS NULL
      BEGIN
        CREATE TABLE [ExternalIdReservation] (
          [ExternalId] NVARCHAR(128) NOT NULL PRIMARY KEY,
          [FirstPlayerId] NVARCHAR(128) NULL,
          [Source] NVARCHAR(32) NOT NULL,
          [FirstSeenAt] DATETIME2 NOT NULL CONSTRAINT [DF_ExternalIdReservation_FirstSeenAt] DEFAULT SYSUTCDATETIME()
        )
      END
    `);
  }
}

function mapLegacyPlayerRowToPlayerShape(row: LegacyMemberAccountRow) {
  const now = row.Create_Date || new Date();

  return {
    id: row.User_GUID,
    externalId: row.EMail || row.User_GUID,
    nickname: row.Game_Nick || row.User_GUID,
    status: mapLegacyStatusToStatus(row.Status),
    note: null,
    tags: null,
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

function buildPlayerAuditSnapshot(player: {
  externalId: string;
  nickname: string;
  status: string;
  note?: string | null;
  tags?: string | null;
}) {
  return {
    externalId: player.externalId,
    nickname: player.nickname,
    status: player.status,
    note: player.note ?? null,
    tags: player.tags ?? null,
  };
}

function normalizeOptionalNullableText(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalTags(value?: string) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const tags = Array.from(
    new Set(
      trimmed
        .split(/[\s,，]+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

  return tags.length ? tags.join(', ') : null;
}

function buildLegacyPlayerAuditSnapshot(row: LegacyMemberAccountRow) {
  return {
    externalId: row.EMail || row.User_GUID,
    nickname: row.Game_Nick || row.User_GUID,
    status: mapLegacyStatusToStatus(row.Status),
  };
}

function mapStatusToLegacyStatus(status: string) {
  return status === 'banned' ? 'N' : 'Y';
}

function filterMockPlayers(options: {
  search?: string;
  status?: string;
  createdRange?: { gte: Date; lt: Date };
}) {
  const normalizedSearch = options.search?.toLowerCase();
  const normalizedStatus = options.status?.toLowerCase();

  const result = listMockPlayers().filter((player) => {
    const matchesSearch = normalizedSearch
      ? player.externalId.toLowerCase().includes(normalizedSearch) ||
        player.nickname.toLowerCase().includes(normalizedSearch) ||
        String(player.note || '').toLowerCase().includes(normalizedSearch) ||
        String(player.tags || '').toLowerCase().includes(normalizedSearch)
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
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

function clampOffset(offset?: number) {
  if (offset == null || Number.isNaN(offset)) {
    return 0;
  }

  return Math.max(Math.trunc(offset), 0);
}

function toSafeNumber(value: number | bigint) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function serializePlayer<T extends { coinBalance: bigint; [key: string]: unknown }>(
  player: T,
) {
  return {
    ...player,
    coinBalance: player.coinBalance.toString(),
  };
}
