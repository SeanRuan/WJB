import {
    IsIn,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'externalId 至少 4 個字元' })
  @MaxLength(64, { message: 'externalId 最多 64 個字元' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'externalId 僅允許英數、底線(_)與連字號(-)',
  })
  externalId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'nickname 至少 2 個字元' })
  @MaxLength(24, { message: 'nickname 最多 24 個字元' })
  @Matches(/\S/, { message: 'nickname 不可為空白' })
  nickname?: string;

  @IsOptional()
  @IsIn(['active', 'banned'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'note 最多 200 個字元' })
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'tags 最多 120 個字元' })
  tags?: string;

  @IsString()
  @MinLength(2, { message: 'reason 至少 2 個字元' })
  @MaxLength(120, { message: 'reason 最多 120 個字元' })
  @Matches(/\S/, { message: 'reason 不可為空白' })
  reason!: string;
}
