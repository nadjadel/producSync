import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ 
    example: 'operator', 
    description: 'User role',
    enum: ['admin', 'manager', 'operator', 'viewer'],
    default: 'operator'
  })
  @IsOptional()
  @IsEnum(['admin', 'manager', 'operator', 'viewer'])
  role?: string;

  @ApiPropertyOptional({ example: '+33123456789', description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: 'Production', description: 'User department' })
  @IsOptional()
  @IsString()
  department?: string;
}
