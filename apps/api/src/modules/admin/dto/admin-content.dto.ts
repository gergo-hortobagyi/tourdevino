import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpsertContentPageDto {
  @IsString()
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @MaxLength(20_000)
  body!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class PatchContentPageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  body?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpsertFaqDto {
  @IsString()
  @MaxLength(300)
  question!: string;

  @IsString()
  @MaxLength(20_000)
  answer!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class PatchFaqDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  question?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  answer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
