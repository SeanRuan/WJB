import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ReviewRechargeOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  @Matches(/\S/, { message: 'reviewNote 不可為空白' })
  reviewNote!: string;
}
