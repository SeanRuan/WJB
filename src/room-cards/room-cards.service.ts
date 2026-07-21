import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import { AuditService } from '../audit/audit.service';
import { listMockPlayers, updateMockPlayerRoomCardBalance } from '../players/mock-players';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustRoomCardBalanceDto } from './dto/adjust-room-card-balance.dto';

type ListRoomCardBalancesOptions = {
  search?: string;
  playerId?: string;
  take?: number;
};

type ListRoomCardLogsOptions = {
  search?: string;
  playerId?: string;
  sourceType?: string;
  take?: number;
};

type LegacyRoomCardBalanceRow = {
  User_GUID: string;
  EMail: string | null;
  Game_Nick: string | null;
  RoomCards: number | null;
  Create_Date: Date | null;
};

type LegacyRoomCardLogRow = {
  Log_No: number;
  User_GUID: string | null;
  Game_Nick: string | null;
  EMail: string | null;
  RoomCards: number | null;
  RoomCards_New: number | null;
  Game_Result_No: number | null;
  Game_RoomIndex: number | null;
  IAP_No: number | null;
  Guild_Log_No: number | null;
  Other_Buy_Type: string | null;
  Create_Date: Date | null;
};

@Injectable()
export class RoomCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listBalances(options: ListRoomCardBalancesOptions) {
    const take = clampTake(options.take);
    const search = options.search?.trim();
    const playerId = options.playerId?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockBalances({ search, playerId, take });
    }

    try {
      return await this.prisma.roomCardBalance.findMany({
        where: {
          ...(playerId ? { playerId } : {}),
          ...(search
            ? {
                player: {
                  OR: [
                    { externalId: { contains: search } },
                    { nickname: { contains: search } },
                  ],
                },
              }
            : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take,
        include: {
          player: {
            select: { externalId: true, nickname: true },
          },
        },
      });
    } catch {
      const rows = await this.prisma.$queryRaw<LegacyRoomCardBalanceRow[]>`
        SELECT TOP (${take})
          [User_GUID],
          [EMail],
          [Game_Nick],
          [RoomCards],
          [Create_Date]
        FROM [T_Member_Account]
        WHERE (
          ${playerId || ''} = '' OR
          [User_GUID] = ${playerId || ''}
        )
        AND (
          ${search || ''} = '' OR
          [User_GUID] LIKE '%' + ${search || ''} + '%' OR
          [EMail] LIKE '%' + ${search || ''} + '%' OR
          [Game_Nick] LIKE '%' + ${search || ''} + '%'
        )
        ORDER BY [Create_Date] DESC
      `;

      return rows.map((row) => ({
        playerId: row.User_GUID,
        balance: row.RoomCards ?? 0,
        updatedAt: row.Create_Date || new Date(),
        player: {
          externalId: row.EMail || row.User_GUID,
          nickname: row.Game_Nick || row.User_GUID,
        },
      }));
    }
  }

  async listLogs(options: ListRoomCardLogsOptions) {
    const take = clampTake(options.take);
    const search = options.search?.trim();
    const playerId = options.playerId?.trim();
    const sourceType = options.sourceType?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockLogs({ search, playerId, sourceType, take });
    }

    try {
      return await this.prisma.roomCardLog.findMany({
        where: {
          ...(playerId ? { playerId } : {}),
          ...(search
            ? {
                player: {
                  OR: [
                    { externalId: { contains: search } },
                    { nickname: { contains: search } },
                  ],
                },
              }
            : {}),
          sourceType: sourceType || undefined,
        },
        orderBy: { createdAt: 'desc' },
        take,
      });
    } catch {
      const rows = await this.prisma.$queryRaw<LegacyRoomCardLogRow[]>`
        SELECT TOP (${take * 4})
          l.[Log_No],
          l.[User_GUID],
          m.[Game_Nick],
          m.[EMail],
          l.[RoomCards],
          l.[RoomCards_New],
          l.[Game_Result_No],
          l.[Game_RoomIndex],
          l.[IAP_No],
          l.[Guild_Log_No],
          l.[Other_Buy_Type],
          l.[Create_Date]
        FROM [T_Member_RoomCards_Log] l
        LEFT JOIN [T_Member_Account] m
          ON m.[User_GUID] = l.[User_GUID]
        WHERE (
          ${playerId || ''} = '' OR
          l.[User_GUID] = ${playerId || ''}
        )
        AND (
          ${search || ''} = '' OR
          l.[User_GUID] LIKE '%' + ${search || ''} + '%' OR
          m.[EMail] LIKE '%' + ${search || ''} + '%' OR
          m.[Game_Nick] LIKE '%' + ${search || ''} + '%'
        )
        ORDER BY l.[Create_Date] DESC
      `;

      return rows
        .map((row) => mapLegacyRoomCardLogRow(row))
        .filter((row) => (sourceType ? row.sourceType === sourceType : true))
        .slice(0, take);
    }
  }

  // 手動調整：異動一律留下 RoomCardLog（sourceType = admin_adjust），不可讓餘額變負數。
  async adjustBalance(dto: AdjustRoomCardBalanceDto, adminId: string) {
    const note = String(dto.note || '').trim();
    if (!note) {
      throw new BadRequestException('調整房卡需填寫原因');
    }

    const normalizedDto: AdjustRoomCardBalanceDto = {
      ...dto,
      note,
    };

    if (process.env.DATA_SOURCE === 'mock') {
      const beforeBalance =
        MOCK_ROOM_CARD_BALANCES.find((item) => item.playerId === normalizedDto.playerId)?.balance ?? 0;
      const updatedBalance = adjustMockBalance(normalizedDto, adminId);

      await this.auditService.recordAuditLog({
        action: 'ADJUST_ROOM_CARD_BALANCE',
        entityName: 'RoomCardBalance',
        entityId: normalizedDto.playerId,
        summary: '主管手動調整房卡餘額',
        metadata: {
          before: {
            playerId: normalizedDto.playerId,
            balance: beforeBalance,
          },
          after: {
            playerId: normalizedDto.playerId,
            balance: updatedBalance.balance,
            changeAmount: normalizedDto.changeAmount,
            note,
          },
        },
        adminUserId: adminId,
        playerId: normalizedDto.playerId,
      });

      return updatedBalance;
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.roomCardBalance.findUnique({
        where: { playerId: normalizedDto.playerId },
      });

      const currentBalance = existing?.balance ?? 0;
      const nextBalance = currentBalance + normalizedDto.changeAmount;

      if (nextBalance < 0) {
        throw new BadRequestException(
          `Adjustment would result in a negative room card balance (${nextBalance})`,
        );
      }

      const updatedBalance = await tx.roomCardBalance.upsert({
        where: { playerId: normalizedDto.playerId },
        create: { playerId: normalizedDto.playerId, balance: nextBalance },
        update: { balance: nextBalance },
      });

      await tx.roomCardLog.create({
        data: {
          playerId: normalizedDto.playerId,
          changeAmount: normalizedDto.changeAmount,
          balanceAfter: updatedBalance.balance,
          sourceType: 'admin_adjust',
          adminUserId: adminId,
          note,
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'ADJUST_ROOM_CARD_BALANCE',
          entityName: 'RoomCardBalance',
          entityId: normalizedDto.playerId,
          summary: '主管手動調整房卡餘額',
          metadata: {
            before: {
              playerId: normalizedDto.playerId,
              balance: currentBalance,
            },
            after: {
              playerId: normalizedDto.playerId,
              balance: updatedBalance.balance,
              changeAmount: normalizedDto.changeAmount,
              note,
            },
          },
          adminUserId: adminId,
          playerId: normalizedDto.playerId,
        },
        tx,
      );

      return updatedBalance;
    });
  }
}

function mapLegacyRoomCardLogRow(row: LegacyRoomCardLogRow) {
  return {
    id: String(row.Log_No),
    playerId: row.User_GUID || '-',
    changeAmount: row.RoomCards ?? 0,
    balanceAfter: row.RoomCards_New ?? 0,
    sourceType: inferLegacySourceType(row),
    relatedTableId:
      row.Game_RoomIndex != null
        ? String(row.Game_RoomIndex)
        : row.Game_Result_No != null
          ? String(row.Game_Result_No)
          : null,
    relatedRechargeOrderId: row.IAP_No != null ? String(row.IAP_No) : null,
    adminUserId: null,
    note: row.Other_Buy_Type,
    createdAt: row.Create_Date || new Date(),
  };
}

function inferLegacySourceType(row: LegacyRoomCardLogRow) {
  const buyType = row.Other_Buy_Type?.toLowerCase() || '';
  const rechargeKeywords = ['iap', 'recharge', 'topup', '儲值', '充值', 'buy'];
  const looksLikeRecharge =
    row.IAP_No != null ||
    rechargeKeywords.some((keyword) => buyType.includes(keyword));

  if (looksLikeRecharge || ((row.RoomCards ?? 0) > 0 && row.Game_Result_No == null)) {
    return 'recharge';
  }

  if (row.Game_Result_No != null || row.Game_RoomIndex != null) {
    return 'open_table';
  }

  return 'admin_adjust';
}

type MockRoomCardBalance = {
  playerId: string;
  balance: number;
  updatedAt: Date;
  player: { externalId: string; nickname: string };
};

type PersistedMockRoomCardBalance = {
  playerId: string;
  balance: number;
  updatedAt: string;
  player: { externalId: string; nickname: string };
};

type PersistedMockRoomCardLog = {
  id: string;
  playerId: string;
  changeAmount: number;
  balanceAfter: number;
  sourceType: string;
  relatedTableId: string | null;
  relatedRechargeOrderId: string | null;
  adminUserId: string | null;
  note: string | null;
  createdAt: string;
};

type PersistedMockRoomCardState = {
  balances: PersistedMockRoomCardBalance[];
  logs: PersistedMockRoomCardLog[];
};

const MOCK_ROOM_CARD_STATE_PATH = path.join(
  process.cwd(),
  '.cache',
  'mock-state',
  'room-cards.json',
);

const SEEDED_MOCK_ROOM_CARD_BALANCES: MockRoomCardBalance[] = [
  {
    playerId: 'mock_player_001',
    balance: 220,
    updatedAt: new Date('2026-07-17T10:00:00.000Z'),
    player: { externalId: 'wuji-test-1001', nickname: '青龍' },
  },
  {
    playerId: 'mock_player_002',
    balance: 55,
    updatedAt: new Date('2026-07-16T16:00:00.000Z'),
    player: { externalId: 'wuji-test-1002', nickname: '白虎' },
  },
  {
    playerId: 'mock_player_003',
    balance: 0,
    updatedAt: new Date('2026-07-10T09:00:00.000Z'),
    player: { externalId: 'wuji-test-1003', nickname: '玄武' },
  },
];

type MockRoomCardLog = {
  id: string;
  playerId: string;
  changeAmount: number;
  balanceAfter: number;
  sourceType: string;
  relatedTableId: string | null;
  relatedRechargeOrderId: string | null;
  adminUserId: string | null;
  note: string | null;
  createdAt: Date;
};

const SEEDED_MOCK_ROOM_CARD_LOGS: MockRoomCardLog[] = [
  {
    id: 'mock_room_card_log_001',
    playerId: 'mock_player_002',
    changeAmount: 55,
    balanceAfter: 55,
    sourceType: 'recharge',
    relatedTableId: null,
    relatedRechargeOrderId: 'mock_recharge_002',
    adminUserId: 'mock_admin_manager_01',
    note: 'Recharge order mock_recharge_002 confirmed',
    createdAt: new Date('2026-07-16T16:00:00.000Z'),
  },
  {
    id: 'mock_room_card_log_002',
    playerId: 'mock_player_001',
    changeAmount: -20,
    balanceAfter: 220,
    sourceType: 'open_table',
    relatedTableId: 'mock_table_001',
    relatedRechargeOrderId: null,
    adminUserId: null,
    note: null,
    createdAt: new Date('2026-07-17T11:30:00.000Z'),
  },
];

const MOCK_ROOM_CARD_STATE = loadMockRoomCardState();
const MOCK_ROOM_CARD_BALANCES: MockRoomCardBalance[] = MOCK_ROOM_CARD_STATE.balances;
const MOCK_ROOM_CARD_LOGS: MockRoomCardLog[] = MOCK_ROOM_CARD_STATE.logs;
let mockRoomCardLogSequence = MOCK_ROOM_CARD_LOGS.length;

function filterMockBalances(options: { search?: string; playerId?: string; take: number }) {
  const normalizedSearch = options.search?.toLowerCase();
  const normalizedPlayerId = options.playerId?.trim();
  const balances = getMockBalances();

  const result = balances.filter((balance) => {
    const matchesSearch = normalizedSearch
      ? balance.player.externalId.toLowerCase().includes(normalizedSearch) ||
        balance.player.nickname.toLowerCase().includes(normalizedSearch)
      : true;
    const matchesPlayerId = normalizedPlayerId
      ? balance.playerId === normalizedPlayerId
      : true;

    return matchesSearch && matchesPlayerId;
  });

  return result
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, options.take);
}

function getMockBalances() {
  const balancesByPlayerId = new Map(
    MOCK_ROOM_CARD_BALANCES.map((balance) => [balance.playerId, balance]),
  );

  listMockPlayers().forEach((player) => {
    if (!balancesByPlayerId.has(player.id)) {
      balancesByPlayerId.set(player.id, {
        playerId: player.id,
        balance: player.roomCardBalance?.balance ?? 0,
        updatedAt: player.updatedAt,
        player: {
          externalId: player.externalId,
          nickname: player.nickname,
        },
      });
    }
  });

  return [...balancesByPlayerId.values()];
}

function filterMockLogs(options: {
  search?: string;
  playerId?: string;
  sourceType?: string;
  take: number;
}) {
  const normalizedSearch = options.search?.toLowerCase();
  const normalizedPlayerId = options.playerId?.trim();
  const normalizedSourceType = options.sourceType?.toLowerCase();

  const matchingPlayerIds = normalizedSearch
    ? listMockPlayers()
        .filter(
          (player) =>
            player.externalId.toLowerCase().includes(normalizedSearch) ||
            player.nickname.toLowerCase().includes(normalizedSearch),
        )
        .map((player) => player.id)
    : null;

  const result = MOCK_ROOM_CARD_LOGS.filter((log) => {
    const matchesPlayer = matchingPlayerIds
      ? matchingPlayerIds.includes(log.playerId)
      : true;
    const matchesPlayerId = normalizedPlayerId
      ? log.playerId === normalizedPlayerId
      : true;
    const matchesSourceType = normalizedSourceType
      ? log.sourceType.toLowerCase() === normalizedSourceType
      : true;

    return matchesPlayer && matchesPlayerId && matchesSourceType;
  });

  return result
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, options.take);
}

function adjustMockBalance(dto: AdjustRoomCardBalanceDto, adminId: string) {
  let balanceEntry = MOCK_ROOM_CARD_BALANCES.find(
    (balance) => balance.playerId === dto.playerId,
  );

  const currentBalance = balanceEntry?.balance ?? 0;
  const nextBalance = currentBalance + dto.changeAmount;

  if (nextBalance < 0) {
    throw new BadRequestException(
      `Adjustment would result in a negative room card balance (${nextBalance})`,
    );
  }

  if (!balanceEntry) {
    balanceEntry = {
      playerId: dto.playerId,
      balance: nextBalance,
      updatedAt: new Date(),
      player: { externalId: dto.playerId, nickname: dto.playerId },
    };
    MOCK_ROOM_CARD_BALANCES.push(balanceEntry);
  } else {
    balanceEntry.balance = nextBalance;
    balanceEntry.updatedAt = new Date();
  }

  updateMockPlayerRoomCardBalance(dto.playerId, nextBalance);

  mockRoomCardLogSequence += 1;

  MOCK_ROOM_CARD_LOGS.unshift({
    id: `mock_room_card_log_${String(mockRoomCardLogSequence).padStart(3, '0')}`,
    playerId: dto.playerId,
    changeAmount: dto.changeAmount,
    balanceAfter: nextBalance,
    sourceType: 'admin_adjust',
    relatedTableId: null,
    relatedRechargeOrderId: null,
    adminUserId: adminId,
    note: dto.note,
    createdAt: new Date(),
  });

  saveMockRoomCardState(MOCK_ROOM_CARD_BALANCES, MOCK_ROOM_CARD_LOGS);

  return balanceEntry;
}

function loadMockRoomCardState(): { balances: MockRoomCardBalance[]; logs: MockRoomCardLog[] } {
  if (!existsSync(MOCK_ROOM_CARD_STATE_PATH)) {
    const seededState = {
      balances: SEEDED_MOCK_ROOM_CARD_BALANCES,
      logs: SEEDED_MOCK_ROOM_CARD_LOGS,
    };
    saveMockRoomCardState(seededState.balances, seededState.logs);
    return seededState;
  }

  try {
    const content = readFileSync(MOCK_ROOM_CARD_STATE_PATH, 'utf8');
    const parsed = JSON.parse(content) as PersistedMockRoomCardState;
    const balances = Array.isArray(parsed?.balances) ? parsed.balances.map(deserializeMockRoomCardBalance) : SEEDED_MOCK_ROOM_CARD_BALANCES;
    const logs = Array.isArray(parsed?.logs) ? parsed.logs.map(deserializeMockRoomCardLog) : SEEDED_MOCK_ROOM_CARD_LOGS;
    return { balances, logs };
  } catch {
    const seededState = {
      balances: SEEDED_MOCK_ROOM_CARD_BALANCES,
      logs: SEEDED_MOCK_ROOM_CARD_LOGS,
    };
    saveMockRoomCardState(seededState.balances, seededState.logs);
    return seededState;
  }
}

function saveMockRoomCardState(balances: MockRoomCardBalance[], logs: MockRoomCardLog[]) {
  const payload: PersistedMockRoomCardState = {
    balances: balances.map(serializeMockRoomCardBalance),
    logs: logs.map(serializeMockRoomCardLog),
  };

  mkdirSync(path.dirname(MOCK_ROOM_CARD_STATE_PATH), { recursive: true });
  writeFileSync(MOCK_ROOM_CARD_STATE_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function serializeMockRoomCardBalance(balance: MockRoomCardBalance): PersistedMockRoomCardBalance {
  return {
    ...balance,
    updatedAt: balance.updatedAt.toISOString(),
  };
}

function deserializeMockRoomCardBalance(balance: PersistedMockRoomCardBalance): MockRoomCardBalance {
  return {
    ...balance,
    updatedAt: new Date(balance.updatedAt),
  };
}

function serializeMockRoomCardLog(log: MockRoomCardLog): PersistedMockRoomCardLog {
  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
  };
}

function deserializeMockRoomCardLog(log: PersistedMockRoomCardLog): MockRoomCardLog {
  return {
    ...log,
    createdAt: new Date(log.createdAt),
  };
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}
