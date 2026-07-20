import { IsIn } from 'class-validator';

export class UpdatePlayerStatusDto {
  @IsIn(['active', 'banned'])
  status!: string;
}
