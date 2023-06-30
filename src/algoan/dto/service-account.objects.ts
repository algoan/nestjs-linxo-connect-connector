import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { Env } from '../../linxo-connect/dto/env.enums';
import { WidgetConfig } from './widget-config.objects';

/**
 * Client Config
 */
export class ClientConfig {
  @IsString()
  public clientId: string;

  @IsString()
  public clientSecret: string;

  @IsString()
  public connectionUrl: string;

  @IsNumber()
  @IsPositive()
  public finalConnectionTimeoutInMS: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetConfig)
  public widgetConfig?: WidgetConfig;

  @IsOptional()
  @IsEnum(Env)
  public env?: Env;
}
