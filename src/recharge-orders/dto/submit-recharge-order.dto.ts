import {
    IsISO8601,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class SubmitRechargeOrderDto {
  @IsString()
  @MinLength(1)
  playerId!: string;

  @IsInt()
  @IsPositive()
  amount!: number;

  @IsInt()
  @IsPositive()
  roomCardAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(5)
  bankAccountLast5?: string;

  @IsOptional()
  @IsISO8601()
  transferredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  proofNote?: string;
}
