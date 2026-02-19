import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  subscriptionStatus?: string;

  @IsOptional()
  subscriptionEndsAt?: Date;
}
