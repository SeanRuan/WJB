import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateGuildMemberRoleDto {
  @IsString()
  @IsIn(['member', 'master'])
  role!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Matches(/\S/, { message: 'note 不可為空白' })
  note!: string;
}
