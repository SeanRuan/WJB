import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RemoveGuildMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
