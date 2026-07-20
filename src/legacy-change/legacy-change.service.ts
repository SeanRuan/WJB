import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';

import { PrismaService } from '../prisma/prisma.service';

type LegacyTableSnapshot = {
  table: string;
  rowCount: number;
  latestAt: string | null;
  checksum: number | null;
  roomCardsTotal?: number;
  rechargeLikeCount?: number;
};

type LegacySnapshot = {
  capturedAt: string;
  actorAdminId: string | null;
  dataSource: string;
  tables: LegacyTableSnapshot[];
};

type LegacySnapshotChange = {
  table: string;
  changed: boolean;
  before: LegacyTableSnapshot | null;
  after: LegacyTableSnapshot;
};

type LegacySnapshotJournalEntry = {
  snapshot: LegacySnapshot;
  changes: LegacySnapshotChange[];
};

type LegacyStatsRow = {
  rowCount: number | null;
  latestAt: Date | null;
  checksum: number | null;
  roomCardsTotal?: number | null;
  rechargeLikeCount?: number | null;
};

@Injectable()
export class LegacyChangeService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly journalPath = path.join(
    process.cwd(),
    'logs',
    'legacy-change-journal.jsonl',
  );

  async captureAndRecordSnapshot(actorAdminId?: string) {
    const snapshot = await this.captureSnapshot(actorAdminId ?? null);
    const previous = await this.readLatestEntry();
    const changes = this.buildChanges(previous?.snapshot ?? null, snapshot);
    const entry: LegacySnapshotJournalEntry = { snapshot, changes };

    await this.appendEntry(entry);

    return {
      snapshot,
      changedTables: changes.filter((item) => item.changed),
      hasChanges: changes.some((item) => item.changed),
      journalPath: this.journalPath,
    };
  }

  async getRecentHistory(take: number) {
    const lines = await this.readAllLines();
    const cappedTake = Math.min(Math.max(Math.trunc(take || 20), 1), 200);

    return lines
      .slice(-cappedTake)
      .reverse()
      .map((line) => JSON.parse(line) as LegacySnapshotJournalEntry);
  }

  private async captureSnapshot(actorAdminId: string | null): Promise<LegacySnapshot> {
    if (process.env.DATA_SOURCE === 'mock') {
      return {
        capturedAt: new Date().toISOString(),
        actorAdminId,
        dataSource: 'mock',
        tables: [
          {
            table: 'mock',
            rowCount: 0,
            latestAt: null,
            checksum: 0,
          },
        ],
      };
    }

    const users = await this.prisma.$queryRaw<LegacyStatsRow[]>`
      SELECT
        COUNT(1) AS [rowCount],
        MAX([UpdateDateTime]) AS [latestAt],
        CHECKSUM_AGG(BINARY_CHECKSUM([User_no], [User_accnt], [User_level], [Status], [UpdateDateTime])) AS [checksum]
      FROM [Users]
    `;

    const memberAccounts = await this.prisma.$queryRaw<LegacyStatsRow[]>`
      SELECT
        COUNT(1) AS [rowCount],
        MAX([Create_Date]) AS [latestAt],
        CHECKSUM_AGG(BINARY_CHECKSUM([User_GUID], [Game_Nick], [Status], [RoomCards], [Gold], [Guild_ID])) AS [checksum],
        SUM(COALESCE([RoomCards], 0)) AS [roomCardsTotal]
      FROM [T_Member_Account]
    `;

    const roomCardLogs = await this.prisma.$queryRaw<LegacyStatsRow[]>`
      SELECT
        COUNT(1) AS [rowCount],
        MAX([Create_Date]) AS [latestAt],
        CHECKSUM_AGG(BINARY_CHECKSUM([Log_No], [User_GUID], [RoomCards], [RoomCards_New], [IAP_No], [Other_Buy_Type], [Create_Date])) AS [checksum],
        SUM(CASE
          WHEN [IAP_No] IS NOT NULL
            OR [Other_Buy_Type] LIKE '%IAP%'
            OR [Other_Buy_Type] LIKE '%recharge%'
            OR [Other_Buy_Type] LIKE N'%儲值%'
            OR [Other_Buy_Type] LIKE N'%充值%'
            OR [Other_Buy_Type] LIKE '%topup%'
            OR [Other_Buy_Type] LIKE '%buy%'
          THEN 1
          ELSE 0
        END) AS [rechargeLikeCount]
      FROM [T_Member_RoomCards_Log]
    `;

    return {
      capturedAt: new Date().toISOString(),
      actorAdminId,
      dataSource: 'prisma',
      tables: [
        this.mapStats('Users', users[0]),
        this.mapStats('T_Member_Account', memberAccounts[0]),
        this.mapStats('T_Member_RoomCards_Log', roomCardLogs[0]),
      ],
    };
  }

  private mapStats(table: string, row?: LegacyStatsRow): LegacyTableSnapshot {
    return {
      table,
      rowCount: row?.rowCount ?? 0,
      latestAt: row?.latestAt ? new Date(row.latestAt).toISOString() : null,
      checksum: row?.checksum ?? null,
      roomCardsTotal: row?.roomCardsTotal ?? undefined,
      rechargeLikeCount: row?.rechargeLikeCount ?? undefined,
    };
  }

  private buildChanges(
    previous: LegacySnapshot | null,
    current: LegacySnapshot,
  ): LegacySnapshotChange[] {
    const previousByTable = new Map(
      (previous?.tables ?? []).map((table) => [table.table, table]),
    );

    return current.tables.map((table) => {
      const before = previousByTable.get(table.table) ?? null;
      const changed = !before ||
        before.rowCount !== table.rowCount ||
        before.latestAt !== table.latestAt ||
        before.checksum !== table.checksum ||
        before.roomCardsTotal !== table.roomCardsTotal ||
        before.rechargeLikeCount !== table.rechargeLikeCount;

      return {
        table: table.table,
        changed,
        before,
        after: table,
      };
    });
  }

  private async appendEntry(entry: LegacySnapshotJournalEntry) {
    const dirPath = path.dirname(this.journalPath);
    await mkdir(dirPath, { recursive: true });
    await writeFile(this.journalPath, `${JSON.stringify(entry)}\n`, {
      encoding: 'utf8',
      flag: 'a',
    });
  }

  private async readLatestEntry() {
    const lines = await this.readAllLines();
    const lastLine = lines.at(-1);

    if (!lastLine) {
      return null;
    }

    try {
      return JSON.parse(lastLine) as LegacySnapshotJournalEntry;
    } catch {
      return null;
    }
  }

  private async readAllLines() {
    try {
      const content = await readFile(this.journalPath, 'utf8');
      return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }
}
