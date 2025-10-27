import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryScheduleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  jobId?: string;

  @IsOptional()
  @IsString()
  jobName?: string;

  @IsOptional()
  @IsIn(['scheduled', 'running', 'completed', 'failed', 'cancelled'])
  status?: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  projectId?: string;
}
