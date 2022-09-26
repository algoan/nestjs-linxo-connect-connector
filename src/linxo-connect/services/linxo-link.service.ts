/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import * as qs from 'qs';
import { Inject, Injectable } from '@nestjs/common';
import { Config } from 'node-config-ts';

import { AxiosResponse } from 'axios';
import { CONFIG } from '../../config/config.module';

import { WidgetSessionObject } from '../dto/widget-session.object';
import { WidgetSessionInput } from '../dto/widget-session.input';
import { WidgetSessionUrlArgs } from '../dto/widget-session.args';
import { CustomHttpService } from '../../shared/services/http.service';
import { WidgetConfig } from '../../algoan/dto/widget-config.objects';

/**
 * Service to manage linxo connect
 */
@Injectable()
export class LinxoConnectLinkService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get the iframe urle
   */
  // eslint-disable-next-line class-methods-use-this
  public async getIframeUrl(
    userAccessToken: string,
    clientId: string,
    clientSecret: string,
    connectionUrl: string,
    callbackUrl: string,
    widgetConfig?: WidgetConfig,
  ): Promise<string> {
    const input: WidgetSessionInput = {
      access_token: userAccessToken,
      client_id: clientId,
      client_secret: clientSecret,
    };

    const result: AxiosResponse<WidgetSessionObject> = await this.customHttpService.post<
      WidgetSessionObject,
      WidgetSessionInput
    >(this.config.linxoConnect.embedBaseUrl, `/widget/widget_session`, input);

    const widgetSessionParams: WidgetSessionUrlArgs = {
      redirect_uri: callbackUrl,
      aspsp_callback_uri: connectionUrl,
      consent_per_account: true,
      wait_sync_end: true,
      lng: widgetConfig?.iframe?.language,
      font: widgetConfig?.iframe?.font,
      font_color: widgetConfig?.iframe?.fontColor,
    };

    // eslint-disable-next-line no-underscore-dangle
    return `${result.data._links.add_connection}&${qs.stringify(widgetSessionParams)}`;
  }
}
