import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(['Administrator', 'User'])
  role?: string;

  @IsOptional()
  @IsEnum(['Actif', 'Inactif'])
  status?: string;
}
