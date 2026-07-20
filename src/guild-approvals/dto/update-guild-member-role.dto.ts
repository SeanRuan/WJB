import { IsIn, IsString } from 'class-validator';

export class UpdateGuildMemberRoleDto {
  @IsString()
  @IsIn(['member', 'master'])
  role!: string;
}
