import { BadRequestException, Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { listMockPlayers } from '../players/mock-players';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustRoomCardBalanceDto } from './dto/adjust-room-card-balance.dto';

type ListRoomCardBalancesOptions = {
  search?: string;
  take?: number;
};

type ListRoomCardLogsOptions = {
  search?: string;
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

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockBalances({ search, take });
    }

    try {
      return await this.prisma.roomCardBalance.findMany({
        where: search
          ? {
              player: {
                OR: [
                  { externalId: { contains: search } },
                  { nickname: { contains: search } },
                ],
              },
            }
          : undefined,
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
    const sourceType = options.sourceType?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockLogs({ search, sourceType, take });
    }

    try {
      return await this.prisma.roomCardLog.findMany({
        where: {
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
    if (process.env.DATA_SOURCE === 'mock') {
      const updatedBalance = adjustMockBalance(dto, adminId);

      await this.auditService.recordAuditLog({
        action: 'ADJUST_ROOM_CARD_BALANCE',
        entityName: 'RoomCardBalance',
        entityId: dto.playerId,
        summary: '主管手動調整房卡餘額',
        metadata: {
          playerId: dto.playerId,
          changeAmount: dto.changeAmount,
          note: dto.note,
          balanceAfter: updatedBalance.balance,
        },
        adminUserId: adminId,
        playerId: dto.playerId,
      });

      return updatedBalance;
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.roomCardBalance.findUnique({
        where: { playerId: dto.playerId },
      });

      const currentBalance = existing?.balance ?? 0;
      const nextBalance = currentBalance + dto.changeAmount;

      if (nextBalance < 0) {
        throw new BadRequestException(
          `Adjustment would result in a negative room card balance (${nextBalance})`,
        );
      }

      const updatedBalance = await tx.roomCardBalance.upsert({
        where: { playerId: dto.playerId },
        create: { playerId: dto.playerId, balance: nextBalance },
        update: { balance: nextBalance },
      });

      await tx.roomCardLog.create({
        data: {
          playerId: dto.playerId,
          changeAmount: dto.changeAmount,
          balanceAfter: updatedBalance.balance,
          sourceType: 'admin_adjust',
          adminUserId: adminId,
          note: dto.note,
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'ADJUST_ROOM_CARD_BALANCE',
          entityName: 'RoomCardBalance',
          entityId: dto.playerId,
          summary: '主管手動調整房卡餘額',
          metadata: {
            playerId: dto.playerId,
            changeAmount: dto.changeAmount,
            note: dto.note,
            balanceAfter: updatedBalance.balance,
          },
          adminUserId: adminId,
          playerId: dto.playerId,
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

const MOCK_ROOM_CARD_BALANCES: MockRoomCardBalance[] = [
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

const MOCK_ROOM_CARD_LOGS: MockRoomCardLog[] = [
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

let mockRoomCardLogSequence = MOCK_ROOM_CARD_LOGS.length;

function filterMockBalances(options: { search?: string; take: number }) {
  const normalizedSearch = options.search?.toLowerCase();

  const result = normalizedSearch
    ? MOCK_ROOM_CARD_BALANCES.filter(
        (balance) =>
          balance.player.externalId.toLowerCase().includes(normalizedSearch) ||
          balance.player.nickname.toLowerCase().includes(normalizedSearch),
      )
    : MOCK_ROOM_CARD_BALANCES;

  return result
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, options.take);
}

function filterMockLogs(options: {
  search?: string;
  sourceType?: string;
  take: number;
}) {
  const normalizedSearch = options.search?.toLowerCase();
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
    const matchesSourceType = normalizedSourceType
      ? log.sourceType.toLowerCase() === normalizedSourceType
      : true;

    return matchesPlayer && matchesSourceType;
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

  return balanceEntry;
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}
