import { IsString, IsOptional, IsEnum, IsArray, IsNumber, Min, Max, ValidateNested, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class ScheduleDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  day: number; // 0 = Dimanche, 1 = Lundi, ...

  @IsString()
  start_time: string; // Format "HH:MM"

  @IsString()
  end_time: string; // Format "HH:MM"

  @IsBoolean()
  is_active: boolean;
}

class RequiredSkillDto {
  @IsString()
  skill_id: string;

  @IsString()
  skill_name: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  required_level: number;
}

class ToolDto {
  @IsString()
  tool_id: string;

  @IsString()
  tool_name: string;

  @IsString()
  tool_code: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

class MaterialDto {
  @IsString()
  material_id: string;

  @IsString()
  material_name: string;

  @IsString()
  material_code: string;

  @IsNumber()
  @Min(0)
  consumption_rate: number;

  @IsString()
  unit: string;
}

export class CreateWorkstationDto {
  @IsString()
  @IsOptional()
  code?: string; // Généré automatiquement si non fourni

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['manual', 'semi_automatic', 'automatic', 'cnc', 'assembly', 'packaging'])
  type: string;

  @IsString()
  department_id: string;

  @IsString()
  department_name: string;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsNumber()
  @Min(0)
  @Max(24)
  daily_hours: number;

  @IsNumber()
  @Min(0)
  @Max(7)
  weekly_days: number;

  @IsNumber()
  @Min(0)
  setup_time: number;

  @IsNumber()
  @Min(0)
  cycle_time: number;

  @IsNumber()
  @Min(0)
  hourly_cost: number;

  @IsNumber()
  @Min(0)
  hourly_rate: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  schedule: ScheduleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredSkillDto)
  @IsOptional()
  required_skills?: RequiredSkillDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  @IsOptional()
  tools?: ToolDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  @IsOptional()
  materials?: MaterialDto[];

  @IsNumber()
  @Min(0)
  monday_capacity: number;

  @IsNumber()
  @Min(0)
  tuesday_capacity: number;

  @IsNumber()
  @Min(0)
  wednesday_capacity: number;

  @IsNumber()
  @Min(0)
  thursday_capacity: number;

  @IsNumber()
  @Min(0)
  friday_capacity: number;

  @IsNumber()
  @Min(0)
  saturday_capacity: number;

  @IsNumber()
  @Min(0)
  sunday_capacity: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  efficiency_rate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  availability_rate: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  quality_rate: number;

  @IsEnum(['active', 'maintenance', 'inactive', 'broken'])
  @IsOptional()
  status?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  maintenance_schedule?: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  power_requirements?: string;

  @IsString()
  @IsOptional()
  safety_instructions?: string;

  @IsString()
  @IsOptional()
  operating_instructions?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @IsString()
  created_by: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
