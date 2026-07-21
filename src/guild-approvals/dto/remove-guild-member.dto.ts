import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RemoveGuildMemberDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Matches(/\S/, { message: 'note 不可為空白' })
  note!: string;
}
