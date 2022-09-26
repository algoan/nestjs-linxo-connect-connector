import { IsLocale, IsOptional, IsString } from 'class-validator';

/**
 * Iframe Config
 */
export class IFrameConfig {
  @IsOptional()
  @IsLocale()
  public language?: string;

  @IsOptional()
  @IsString()
  public font?: string;

  @IsOptional()
  @IsString()
  public fontColor?: string;
}
