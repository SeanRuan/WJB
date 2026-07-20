import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsIn(['owner', 'manager', 'support'])
  role!: string;
}
