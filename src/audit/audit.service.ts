import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import { PrismaService } from '../prisma/prisma.service';

type ListAuditLogsOptions = {
  entityName?: string;
  action?: string;
  adminUserId?: string;
  playerId?: string;
  createdFrom?: string;
  createdTo?: string;
  take?: number;
};

type RecordAuditLogOptions = {
  action: string;
  entityName: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown> | string;
  adminUserId?: string | null;
  playerId?: string | null;
};

type AuditLogWriter = {
  auditLog: {
    create: (args: {
      data: {
        action: string;
        entityName: string;
        entityId: string;
        summary: string;
        metadata?: string | null;
        adminUserId?: string | null;
        playerId?: string | null;
      };
    }) => Promise<unknown>;
  };
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAuditLog(
    options: RecordAuditLogOptions,
    writer: AuditLogWriter = this.prisma,
  ) {
    if (process.env.DATA_SOURCE === 'mock') {
      return recordMockAuditLog(options);
    }

    try {
      return await writer.auditLog.create({
        data: {
          action: options.action,
          entityName: options.entityName,
          entityId: options.entityId,
          summary: options.summary,
          metadata:
            typeof options.metadata === 'string'
              ? options.metadata
              : options.metadata
                ? JSON.stringify(options.metadata)
                : null,
          adminUserId: options.adminUserId ?? null,
          playerId: options.playerId ?? null,
        },
      });
    } catch {
      return null;
    }
  }

  async listAuditLogs(options: ListAuditLogsOptions) {
    const take = clampTake(options.take);
    const entityName = options.entityName?.trim();
    const action = options.action?.trim();
    const adminUserId = options.adminUserId?.trim();
    const playerId = options.playerId?.trim();
    const createdFrom = parseDateStart(options.createdFrom);
    const createdToExclusive = parseDateEndExclusive(options.createdTo);

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockAuditLogs({
        entityName,
        action,
        adminUserId,
        playerId,
        createdFrom,
        createdToExclusive,
        take,
      });
    }

    try {
      return await this.prisma.auditLog.findMany({
        where: {
          ...(entityName ? { entityName } : {}),
          ...(action ? { action } : {}),
          ...(adminUserId ? { adminUserId } : {}),
          ...(playerId ? { playerId } : {}),
          ...((createdFrom || createdToExclusive)
            ? {
                createdAt: {
                  ...(createdFrom ? { gte: createdFrom } : {}),
                  ...(createdToExclusive ? { lt: createdToExclusive } : {}),
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          action: true,
          entityName: true,
          entityId: true,
          summary: true,
          metadata: true,
          createdAt: true,
          adminUserId: true,
          playerId: true,
        },
      });
    } catch {
      return [];
    }
  }
}

type MockAuditLog = {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  summary: string;
  metadata: string | null;
  createdAt: Date;
  adminUserId: string | null;
  playerId: string | null;
};

type PersistedMockAuditLog = {
  id: string;
  action: string;
  entityName: string;
  entityId: string;
  summary: string;
  metadata: string | null;
  createdAt: string;
  adminUserId: string | null;
  playerId: string | null;
};

const MOCK_STATE_DIR = path.join(process.cwd(), '.cache', 'mock-state');
const MOCK_AUDIT_LOGS_PATH = path.join(MOCK_STATE_DIR, 'audit-logs.json');

const MOCK_AUDIT_LOGS: MockAuditLog[] = loadMockAuditLogs();

function buildSeedMockAuditLogs(): MockAuditLog[] {
  return [
  {
    id: 'mock_audit_001',
    action: 'VIEW_PLAYER',
    entityName: 'Player',
    entityId: 'mock_player_001',
    summary: 'Read-only query for player profile.',
    metadata: '{"source":"mock"}',
    createdAt: new Date('2026-07-16T10:05:00.000Z'),
    adminUserId: 'mock_admin_01',
    playerId: 'mock_player_001',
  },
  {
    id: 'mock_audit_002',
    action: 'LIST_AUDIT',
    entityName: 'AuditLog',
    entityId: 'mock_audit_001',
    summary: 'Audit list viewed in safe development mode.',
    metadata: '{"source":"mock"}',
    createdAt: new Date('2026-07-16T11:15:00.000Z'),
    adminUserId: 'mock_admin_01',
    playerId: null,
  },
  {
    id: 'mock_audit_003',
    action: 'VIEW_PLAYER',
    entityName: 'Player',
    entityId: 'mock_player_003',
    summary: 'Read-only query for player coin balance.',
    metadata: '{"source":"mock"}',
    createdAt: new Date('2026-07-15T23:44:00.000Z'),
    adminUserId: 'mock_admin_02',
    playerId: 'mock_player_003',
  },
  ];
}

let mockAuditLogSequence = MOCK_AUDIT_LOGS.length;

function loadMockAuditLogs(): MockAuditLog[] {
  const persistedLogs = readPersistedMockAuditLogs();

  if (persistedLogs) {
    return persistedLogs;
  }

  const seedLogs = buildSeedMockAuditLogs();
  saveMockAuditLogs(seedLogs);
  return seedLogs;
}

function readPersistedMockAuditLogs() {
  if (!existsSync(MOCK_AUDIT_LOGS_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(MOCK_AUDIT_LOGS_PATH, 'utf8');
    const parsed = JSON.parse(content) as PersistedMockAuditLog[];

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map(deserializeMockAuditLog);
  } catch {
    return null;
  }
}

function saveMockAuditLogs(logs: MockAuditLog[]) {
  ensureMockStateDir();
  const payload = logs.map(serializeMockAuditLog);
  writeFileSync(MOCK_AUDIT_LOGS_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function ensureMockStateDir() {
  mkdirSync(MOCK_STATE_DIR, { recursive: true });
}

function serializeMockAuditLog(log: MockAuditLog): PersistedMockAuditLog {
  return {
    ...log,
    createdAt: log.createdAt.toISOString(),
  };
}

function deserializeMockAuditLog(log: PersistedMockAuditLog): MockAuditLog {
  return {
    ...log,
    createdAt: new Date(log.createdAt),
  };
}

function filterMockAuditLogs(options: {
  entityName?: string;
  action?: string;
  adminUserId?: string;
  playerId?: string;
  createdFrom?: Date;
  createdToExclusive?: Date;
  take: number;
}) {
  const normalizedEntityName = options.entityName?.trim().toLowerCase();
  const normalizedAction = options.action?.trim().toLowerCase();
  const normalizedAdminUserId = options.adminUserId?.trim();
  const normalizedPlayerId = options.playerId?.trim();
  const fromMs = options.createdFrom?.getTime();
  const toExclusiveMs = options.createdToExclusive?.getTime();

  const result = MOCK_AUDIT_LOGS.filter((log) => {
    const matchesEntityName = normalizedEntityName
      ? log.entityName.toLowerCase() === normalizedEntityName
      : true;
    const matchesAction = normalizedAction
      ? log.action.toLowerCase() === normalizedAction
      : true;
    const matchesAdminUserId = normalizedAdminUserId
      ? log.adminUserId === normalizedAdminUserId
      : true;
    const matchesPlayerId = normalizedPlayerId
      ? log.playerId === normalizedPlayerId
      : true;
    const createdAtMs = log.createdAt.getTime();
    const matchesCreatedFrom = fromMs != null ? createdAtMs >= fromMs : true;
    const matchesCreatedTo = toExclusiveMs != null ? createdAtMs < toExclusiveMs : true;

    return (
      matchesEntityName &&
      matchesAction &&
      matchesAdminUserId &&
      matchesPlayerId &&
      matchesCreatedFrom &&
      matchesCreatedTo
    );
  });

  return result
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, options.take);
}

function recordMockAuditLog(options: RecordAuditLogOptions) {
  mockAuditLogSequence += 1;

  const newLog: MockAuditLog = {
    id: `mock_audit_${String(mockAuditLogSequence).padStart(3, '0')}`,
    action: options.action,
    entityName: options.entityName,
    entityId: options.entityId,
    summary: options.summary,
    metadata:
      typeof options.metadata === 'string'
        ? options.metadata
        : options.metadata
          ? JSON.stringify(options.metadata)
          : null,
    createdAt: new Date(),
    adminUserId: options.adminUserId ?? null,
    playerId: options.playerId ?? null,
  };

  MOCK_AUDIT_LOGS.unshift(newLog);
  saveMockAuditLogs(MOCK_AUDIT_LOGS);

  return newLog;
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}

function parseDateStart(input?: string) {
  const value = input?.trim();
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

function parseDateEndExclusive(input?: string) {
  const value = input?.trim();
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day + 1);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}
