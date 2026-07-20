import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class AddGuildMemberDto {
  @IsString()
  @MinLength(1)
  playerId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['member', 'master'])
  role?: string;
}
