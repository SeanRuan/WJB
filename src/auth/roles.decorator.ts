import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// role 三層權限：owner | manager | support（詳見 AdminUser.role 註解）
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
