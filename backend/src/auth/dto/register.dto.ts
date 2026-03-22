import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMINISTRATOR = 'Administrator',
  USER = 'User',
}

export class RegisterDto {
  @ApiProperty({ example: 'Jean Dupont', description: 'Nom complet de l\'utilisateur' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est requis' })
  full_name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email de l\'utilisateur' })
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'L\'email est requis' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mot de passe (min 6 caractères)' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, description: 'Rôle de l\'utilisateur' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
