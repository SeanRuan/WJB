import {
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class CreateGuildApprovalRequestDto {
  @IsString()
  @IsIn(['create_guild', 'update_reference_rate', 'revoke_guild'])
  requestType!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  guildId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
