import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ListAuditLogsOptions = {
  entityName?: string;
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

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockAuditLogs({ entityName, take });
    }

    try {
      return await this.prisma.auditLog.findMany({
        where: entityName ? { entityName } : undefined,
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

const MOCK_AUDIT_LOGS: MockAuditLog[] = [
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

let mockAuditLogSequence = MOCK_AUDIT_LOGS.length;

function filterMockAuditLogs(options: { entityName?: string; take: number }) {
  const normalizedEntityName = options.entityName?.trim().toLowerCase();

  const result = normalizedEntityName
    ? MOCK_AUDIT_LOGS.filter(
        (log) => log.entityName.toLowerCase() === normalizedEntityName,
      )
    : MOCK_AUDIT_LOGS;

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

  return newLog;
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}
