import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewGuildApprovalRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
