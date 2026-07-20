import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRechargeOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
