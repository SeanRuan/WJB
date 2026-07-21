import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AddGuildMemberDto {
  @IsString()
  @MinLength(1)
  playerId!: string;

  @IsOptional()
  @IsString()
  @IsIn(['member', 'master'])
  role?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Matches(/\S/, { message: 'note 不可為空白' })
  note!: string;
}
