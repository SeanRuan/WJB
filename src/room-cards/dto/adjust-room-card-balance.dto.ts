import { IsInt, IsString, MaxLength, MinLength, NotEquals } from 'class-validator';

export class AdjustRoomCardBalanceDto {
  @IsString()
  @MinLength(1)
  playerId!: string;

  @IsInt()
  @NotEquals(0)
  changeAmount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  note!: string;
}
