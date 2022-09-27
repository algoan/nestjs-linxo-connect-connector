import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { IFrameConfig } from './iframe-config.objects';

/**
 * Client Customization Config
 */
export class WidgetConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => IFrameConfig)
  public iframe: IFrameConfig;
}
