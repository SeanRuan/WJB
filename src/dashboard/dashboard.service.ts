import { Injectable } from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { LegacyChangeService } from '../legacy-change/legacy-change.service';
import { PrismaService } from '../prisma/prisma.service';

type DashboardSummary = {
  totals: {
    players: number;
    adminUsers: number;
    pendingRechargeOrders: number;
    confirmedRechargeOrders: number;
    roomCardBalance: number;
  };
  legacyChange: {
    hasChanges: boolean;
    changedTables: string[];
    capturedAt: string | null;
  };
  recentAuditLogs: unknown[];
};

type LegacySnapshotJournalEntry = {
  snapshot: {
    capturedAt: string;
  };
  changes: Array<{
    table: string;
    changed: boolean;
  }>;
};

type LegacyCountRow = {
  count: number;
};

type LegacySumRow = {
  total: number | null;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly legacyChangeService: LegacyChangeService,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    if (process.env.DATA_SOURCE === 'mock') {
      return {
        totals: {
          players: 3,
          adminUsers: 3,
          pendingRechargeOrders: 1,
          confirmedRechargeOrders: 1,
          roomCardBalance: 275,
        },
        legacyChange: {
          hasChanges: false,
          changedTables: [],
          capturedAt: null,
        },
        recentAuditLogs: await this.auditService.listAuditLogs({ take: 5 }),
      };
    }

    try {
      const [playerCount, adminUserCount, pendingRechargeOrders, confirmedRechargeOrders, roomCardBalance] =
        await this.prisma.$transaction([
          this.prisma.player.count(),
          this.prisma.adminUser.count(),
          this.prisma.rechargeOrder.count({ where: { status: 'pending' } }),
          this.prisma.rechargeOrder.count({ where: { status: 'confirmed' } }),
          this.prisma.roomCardBalance.aggregate({
            _sum: { balance: true },
          }),
        ]);

      return {
        totals: {
          players: playerCount,
          adminUsers: adminUserCount,
          pendingRechargeOrders,
          confirmedRechargeOrders,
          roomCardBalance: roomCardBalance._sum.balance ?? 0,
        },
        legacyChange: await this.getLegacyChangeMonitor(),
        recentAuditLogs: await this.auditService.listAuditLogs({ take: 5 }),
      };
    } catch {
      const playerRows = await this.prisma.$queryRaw<LegacyCountRow[]>`
        SELECT COUNT(1) AS [count]
        FROM [T_Member_Account]
      `;
      const adminRows = await this.prisma.$queryRaw<LegacyCountRow[]>`
        SELECT COUNT(1) AS [count]
        FROM [Users]
      `;
      const confirmedRows = await this.prisma.$queryRaw<LegacyCountRow[]>`
        SELECT COUNT(1) AS [count]
        FROM [T_Member_RoomCards_Log]
        WHERE [IAP_No] IS NOT NULL
          OR [Other_Buy_Type] LIKE '%IAP%'
          OR [Other_Buy_Type] LIKE '%recharge%'
          OR [Other_Buy_Type] LIKE N'%儲值%'
          OR [Other_Buy_Type] LIKE N'%充值%'
          OR [Other_Buy_Type] LIKE '%topup%'
          OR [Other_Buy_Type] LIKE '%buy%'
      `;
      const sumRows = await this.prisma.$queryRaw<LegacySumRow[]>`
        SELECT SUM(COALESCE([RoomCards], 0)) AS [total]
        FROM [T_Member_Account]
      `;

      return {
        totals: {
          players: playerRows[0]?.count ?? 0,
          adminUsers: adminRows[0]?.count ?? 0,
          pendingRechargeOrders: 0,
          confirmedRechargeOrders: confirmedRows[0]?.count ?? 0,
          roomCardBalance: sumRows[0]?.total ?? 0,
        },
        legacyChange: await this.getLegacyChangeMonitor(),
        recentAuditLogs: await this.auditService.listAuditLogs({ take: 5 }),
      };
    }
  }

  private async getLegacyChangeMonitor() {
    try {
      const history = await this.legacyChangeService.getRecentHistory(1);
      const latest = (history[0] ?? null) as LegacySnapshotJournalEntry | null;

      if (!latest) {
        return {
          hasChanges: false,
          changedTables: [],
          capturedAt: null,
        };
      }

      const changedTables = latest.changes
        .filter((change) => change.changed)
        .map((change) => change.table);

      return {
        hasChanges: changedTables.length > 0,
        changedTables,
        capturedAt: latest.snapshot.capturedAt,
      };
    } catch {
      return {
        hasChanges: false,
        changedTables: [],
        capturedAt: null,
      };
    }
  }
}
