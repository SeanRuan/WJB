import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewRechargeOrderDto } from './dto/review-recharge-order.dto';
import { SubmitRechargeOrderDto } from './dto/submit-recharge-order.dto';

type ListRechargeOrdersOptions = {
  status?: string;
  take?: number;
};

type LegacyRechargeOrderRow = {
  Log_No: number;
  User_GUID: string | null;
  RoomCards: number | null;
  IAP_No: number | null;
  Other_Buy_Type: string | null;
  Create_Date: Date | null;
};

@Injectable()
export class RechargeOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listRechargeOrders(options: ListRechargeOrdersOptions) {
    const take = clampTake(options.take);
    const status = options.status?.trim();

    if (process.env.DATA_SOURCE === 'mock') {
      return filterMockRechargeOrders({ status, take });
    }

    try {
      return await this.prisma.rechargeOrder.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take,
      });
    } catch {
      if (status && status !== 'confirmed') {
        return [];
      }

      const rows = await this.prisma.$queryRaw<LegacyRechargeOrderRow[]>`
        SELECT TOP (${take})
          [Log_No],
          [User_GUID],
          [RoomCards],
          [IAP_No],
          [Other_Buy_Type],
          [Create_Date]
        FROM [T_Member_RoomCards_Log]
        WHERE [IAP_No] IS NOT NULL
          OR [Other_Buy_Type] LIKE '%IAP%'
          OR [Other_Buy_Type] LIKE '%recharge%'
          OR [Other_Buy_Type] LIKE N'%儲值%'
          OR [Other_Buy_Type] LIKE N'%充值%'
          OR [Other_Buy_Type] LIKE '%topup%'
          OR [Other_Buy_Type] LIKE '%buy%'
        ORDER BY [Create_Date] DESC
      `;

      return rows.map((row) => ({
        id:
          row.IAP_No != null
            ? `legacy_iap_${row.IAP_No}`
            : `legacy_log_${row.Log_No}`,
        playerId: row.User_GUID || '-',
        amount: Math.abs(row.RoomCards ?? 0),
        currency: 'TWD',
        roomCardAmount: Math.abs(row.RoomCards ?? 0),
        paymentChannel: 'manual_transfer',
        bankAccountLast5: null,
        transferredAt: null,
        proofNote: row.Other_Buy_Type,
        status: 'confirmed',
        submittedByAdminId: 'legacy',
        reviewedByAdminId: 'legacy',
        reviewNote: 'Legacy recharge log (read-only projection)',
        createdAt: row.Create_Date || new Date(),
        reviewedAt: row.Create_Date || new Date(),
      }));
    }
  }

  async submitRechargeOrder(dto: SubmitRechargeOrderDto, adminId: string) {
    if (process.env.DATA_SOURCE === 'mock') {
      const createdOrder = submitMockRechargeOrder(dto, adminId);

      await this.auditService.recordAuditLog({
        action: 'SUBMIT_RECHARGE_ORDER',
        entityName: 'RechargeOrder',
        entityId: createdOrder.id,
        summary: '客服登記房卡購買核帳，等待主管核准',
        metadata: {
          playerId: createdOrder.playerId,
          amount: createdOrder.amount,
          roomCardAmount: createdOrder.roomCardAmount,
          status: createdOrder.status,
        },
        adminUserId: adminId,
        playerId: createdOrder.playerId,
      });

      return createdOrder;
    }

    return this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.rechargeOrder.create({
        data: {
          playerId: dto.playerId,
          amount: dto.amount,
          roomCardAmount: dto.roomCardAmount,
          bankAccountLast5: dto.bankAccountLast5,
          transferredAt: dto.transferredAt ? new Date(dto.transferredAt) : undefined,
          proofNote: dto.proofNote,
          submittedByAdminId: adminId,
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'SUBMIT_RECHARGE_ORDER',
          entityName: 'RechargeOrder',
          entityId: createdOrder.id,
          summary: '客服登記房卡購買核帳，等待主管核准',
          metadata: {
            playerId: createdOrder.playerId,
            amount: createdOrder.amount,
            roomCardAmount: createdOrder.roomCardAmount,
            status: createdOrder.status,
          },
          adminUserId: adminId,
          playerId: createdOrder.playerId,
        },
        tx,
      );

      return createdOrder;
    });
  }

  // 核准：將 roomCardAmount 加進 RoomCardBalance，並產生對應的 RoomCardLog（sourceType = recharge），
  // 只有 status = pending 的訂單可以被核准。
  async confirmRechargeOrder(
    id: string,
    dto: ReviewRechargeOrderDto,
    adminId: string,
  ) {
    if (process.env.DATA_SOURCE === 'mock') {
      const confirmedOrder = confirmMockRechargeOrder(id, dto, adminId);

      await this.auditService.recordAuditLog({
        action: 'CONFIRM_RECHARGE_ORDER',
        entityName: 'RechargeOrder',
        entityId: confirmedOrder.id,
        summary: '主管核准房卡購買並完成加房卡',
        metadata: {
          playerId: confirmedOrder.playerId,
          amount: confirmedOrder.amount,
          roomCardAmount: confirmedOrder.roomCardAmount,
          status: confirmedOrder.status,
        },
        adminUserId: adminId,
        playerId: confirmedOrder.playerId,
      });

      return confirmedOrder;
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.rechargeOrder.findUnique({ where: { id } });

      if (!order) {
        throw new NotFoundException(`Recharge order ${id} not found`);
      }

      if (order.status !== 'pending') {
        throw new BadRequestException(
          `Recharge order ${id} is already ${order.status}`,
        );
      }

      const updatedOrder = await tx.rechargeOrder.update({
        where: { id },
        data: {
          status: 'confirmed',
          reviewedByAdminId: adminId,
          reviewNote: dto.reviewNote,
          reviewedAt: new Date(),
        },
      });

      const roomCardBalance = await tx.roomCardBalance.upsert({
        where: { playerId: order.playerId },
        create: { playerId: order.playerId, balance: order.roomCardAmount },
        update: { balance: { increment: order.roomCardAmount } },
      });

      await tx.roomCardLog.create({
        data: {
          playerId: order.playerId,
          changeAmount: order.roomCardAmount,
          balanceAfter: roomCardBalance.balance,
          sourceType: 'recharge',
          relatedRechargeOrderId: order.id,
          adminUserId: adminId,
          note: `Recharge order ${order.id} confirmed`,
        },
      });

      await this.auditService.recordAuditLog(
        {
          action: 'CONFIRM_RECHARGE_ORDER',
          entityName: 'RechargeOrder',
          entityId: order.id,
          summary: '主管核准房卡購買並完成加房卡',
          metadata: {
            playerId: order.playerId,
            amount: order.amount,
            roomCardAmount: order.roomCardAmount,
            status: 'confirmed',
          },
          adminUserId: adminId,
          playerId: order.playerId,
        },
        tx,
      );

      return updatedOrder;
    });
  }

  // 駁回：不套用任何房卡異動，只記錄 reviewNote。
  async rejectRechargeOrder(
    id: string,
    dto: ReviewRechargeOrderDto,
    adminId: string,
  ) {
    if (process.env.DATA_SOURCE === 'mock') {
      const rejectedOrder = rejectMockRechargeOrder(id, dto, adminId);

      await this.auditService.recordAuditLog({
        action: 'REJECT_RECHARGE_ORDER',
        entityName: 'RechargeOrder',
        entityId: rejectedOrder.id,
        summary: '主管駁回房卡購買核帳',
        metadata: {
          playerId: rejectedOrder.playerId,
          amount: rejectedOrder.amount,
          roomCardAmount: rejectedOrder.roomCardAmount,
          status: rejectedOrder.status,
          reviewNote: rejectedOrder.reviewNote,
        },
        adminUserId: adminId,
        playerId: rejectedOrder.playerId,
      });

      return rejectedOrder;
    }

    const order = await this.prisma.rechargeOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Recharge order ${id} not found`);
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(
        `Recharge order ${id} is already ${order.status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const rejectedOrder = await tx.rechargeOrder.update({
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
          action: 'REJECT_RECHARGE_ORDER',
          entityName: 'RechargeOrder',
          entityId: rejectedOrder.id,
          summary: '主管駁回房卡購買核帳',
          metadata: {
            playerId: rejectedOrder.playerId,
            amount: rejectedOrder.amount,
            roomCardAmount: rejectedOrder.roomCardAmount,
            status: rejectedOrder.status,
            reviewNote: rejectedOrder.reviewNote,
          },
          adminUserId: adminId,
          playerId: rejectedOrder.playerId,
        },
        tx,
      );

      return rejectedOrder;
    });
  }
}

type MockRechargeOrder = {
  id: string;
  playerId: string;
  amount: number;
  currency: string;
  roomCardAmount: number;
  paymentChannel: string;
  bankAccountLast5: string | null;
  transferredAt: Date | null;
  proofNote: string | null;
  status: string;
  submittedByAdminId: string;
  reviewedByAdminId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

const MOCK_RECHARGE_ORDERS: MockRechargeOrder[] = [
  {
    id: 'mock_recharge_001',
    playerId: 'mock_player_001',
    amount: 1000,
    currency: 'TWD',
    roomCardAmount: 100,
    paymentChannel: 'manual_transfer',
    bankAccountLast5: '88421',
    transferredAt: new Date('2026-07-17T09:30:00.000Z'),
    proofNote: '玩家提供轉帳截圖，帳號後五碼 88421',
    status: 'pending',
    submittedByAdminId: 'mock_admin_support_01',
    reviewedByAdminId: null,
    reviewNote: null,
    createdAt: new Date('2026-07-17T09:45:00.000Z'),
    reviewedAt: null,
  },
  {
    id: 'mock_recharge_002',
    playerId: 'mock_player_002',
    amount: 500,
    currency: 'TWD',
    roomCardAmount: 55,
    paymentChannel: 'manual_transfer',
    bankAccountLast5: '10023',
    transferredAt: new Date('2026-07-16T14:05:00.000Z'),
    proofNote: '玩家提供轉帳截圖，帳號後五碼 10023',
    status: 'confirmed',
    submittedByAdminId: 'mock_admin_support_01',
    reviewedByAdminId: 'mock_admin_manager_01',
    reviewNote: '核帳無誤，已加房卡',
    createdAt: new Date('2026-07-16T14:20:00.000Z'),
    reviewedAt: new Date('2026-07-16T16:00:00.000Z'),
  },
];

let mockRechargeOrderSequence = MOCK_RECHARGE_ORDERS.length;

function filterMockRechargeOrders(options: { status?: string; take: number }) {
  const normalizedStatus = options.status?.toLowerCase();

  const result = normalizedStatus
    ? MOCK_RECHARGE_ORDERS.filter(
        (order) => order.status.toLowerCase() === normalizedStatus,
      )
    : MOCK_RECHARGE_ORDERS;

  return result
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, options.take);
}

function submitMockRechargeOrder(dto: SubmitRechargeOrderDto, adminId: string) {
  mockRechargeOrderSequence += 1;

  const newOrder: MockRechargeOrder = {
    id: `mock_recharge_${String(mockRechargeOrderSequence).padStart(3, '0')}`,
    playerId: dto.playerId,
    amount: dto.amount,
    currency: 'TWD',
    roomCardAmount: dto.roomCardAmount,
    paymentChannel: 'manual_transfer',
    bankAccountLast5: dto.bankAccountLast5 ?? null,
    transferredAt: dto.transferredAt ? new Date(dto.transferredAt) : null,
    proofNote: dto.proofNote ?? null,
    status: 'pending',
    submittedByAdminId: adminId,
    reviewedByAdminId: null,
    reviewNote: null,
    createdAt: new Date(),
    reviewedAt: null,
  };

  MOCK_RECHARGE_ORDERS.unshift(newOrder);

  return newOrder;
}

function findMockRechargeOrderOrThrow(id: string) {
  const order = MOCK_RECHARGE_ORDERS.find((item) => item.id === id);

  if (!order) {
    throw new NotFoundException(`Recharge order ${id} not found`);
  }

  if (order.status !== 'pending') {
    throw new BadRequestException(
      `Recharge order ${id} is already ${order.status}`,
    );
  }

  return order;
}

function confirmMockRechargeOrder(
  id: string,
  dto: ReviewRechargeOrderDto,
  adminId: string,
) {
  const order = findMockRechargeOrderOrThrow(id);

  order.status = 'confirmed';
  order.reviewedByAdminId = adminId;
  order.reviewNote = dto.reviewNote ?? null;
  order.reviewedAt = new Date();

  // 注意：mock 模式下沒有可共用的房卡餘額 mock store，僅模擬訂單狀態轉換；
  // 實際加房卡與 RoomCardLog 產生只會在 DATA_SOURCE=prisma 模式下真正發生。
  return order;
}

function rejectMockRechargeOrder(
  id: string,
  dto: ReviewRechargeOrderDto,
  adminId: string,
) {
  const order = findMockRechargeOrderOrThrow(id);

  order.status = 'rejected';
  order.reviewedByAdminId = adminId;
  order.reviewNote = dto.reviewNote ?? null;
  order.reviewedAt = new Date();

  return order;
}

function clampTake(take?: number) {
  if (!take || Number.isNaN(take)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(take), 1), 100);
}
