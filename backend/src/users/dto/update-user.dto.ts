import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  full_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(['Administrator', 'User'])
  role?: string;

  @IsOptional()
  @IsEnum(['Actif', 'Inactif'])
  status?: string;
}
