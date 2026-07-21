import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class DisableAdminUserDto {
  @IsString()
  @MinLength(2, { message: 'reason 至少 2 個字元' })
  @MaxLength(120, { message: 'reason 最多 120 個字元' })
  @Matches(/\S/, { message: 'reason 不可為空白' })
  reason!: string;
}
