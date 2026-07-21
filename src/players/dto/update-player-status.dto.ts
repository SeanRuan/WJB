import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePlayerStatusDto {
  @IsIn(['active', 'banned'])
  status!: string;

  @IsString()
  @MinLength(2, { message: 'reason 至少 2 個字元' })
  @MaxLength(120, { message: 'reason 最多 120 個字元' })
  reason!: string;
}
