import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { findMockAdminByEmail } from './mock-admin-users';
import { JwtPayload } from './types';

type AdminRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
};

type LegacyUserRow = {
  User_no: number;
  User_accnt: string;
  User_passwd: string;
  User_name: string | null;
  User_level: number;
  Status: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.findAdminByEmail(dto.email);

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.verifyPassword(
      dto.password,
      admin.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
      },
    };
  }

  private async findAdminByEmail(email: string): Promise<AdminRecord | null> {
    if (process.env.DATA_SOURCE === 'mock') {
      return findMockAdminByEmail(email);
    }

    const modernAdmin = await this.findModernAdminByEmail(email);
    if (modernAdmin) {
      return modernAdmin;
    }

    return this.findLegacyAdminByAccount(email);
  }

  private async findModernAdminByEmail(email: string): Promise<AdminRecord | null> {
    try {
      return await this.prisma.adminUser.findUnique({ where: { email } });
    } catch {
      return null;
    }
  }

  private async findLegacyAdminByAccount(account: string): Promise<AdminRecord | null> {
    try {
      const rows = await this.prisma.$queryRaw<LegacyUserRow[]>`
        SELECT TOP (1)
          [User_no],
          [User_accnt],
          [User_passwd],
          [User_name],
          [User_level],
          [Status]
        FROM [Users]
        WHERE [User_accnt] = ${account}
      `;

      const user = rows[0];
      if (!user) {
        return null;
      }

      return {
        id: String(user.User_no),
        email: user.User_accnt,
        displayName: user.User_name || user.User_accnt,
        passwordHash: user.User_passwd,
        role: this.mapLegacyRole(user.User_level),
        isActive: user.Status !== 'N',
      };
    } catch {
      return null;
    }
  }

  private mapLegacyRole(level: number): string {
    if (level <= 1) {
      return 'owner';
    }
    if (level === 2) {
      return 'manager';
    }
    return 'support';
  }

  private async verifyPassword(
    plainPassword: string,
    storedPasswordHash: string,
  ): Promise<boolean> {
    if (storedPasswordHash.startsWith('$2a$') || storedPasswordHash.startsWith('$2b$')) {
      return bcrypt.compare(plainPassword, storedPasswordHash);
    }

    return plainPassword === storedPasswordHash;
  }
}
