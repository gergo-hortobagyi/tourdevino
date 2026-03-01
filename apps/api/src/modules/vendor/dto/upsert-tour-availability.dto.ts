import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsDateString, IsInt, Max, Min, ValidateNested } from 'class-validator';

class AvailabilityItemDto {
  @IsDateString()
  date!: string;

  @IsInt()
  @Min(1)
  @Max(200)
  capacity!: number;
}

export class UpsertTourAvailabilityDto {
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => AvailabilityItemDto)
  entries!: AvailabilityItemDto[];
}
