/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import * as qs from 'qs';
import { Test, TestingModule } from '@nestjs/testing';
import { config } from 'node-config-ts';

import { createMock } from '@golevelup/ts-jest';
import { ContextIdFactory } from '@nestjs/core';
import { AxiosResponse } from 'axios';
import { CONFIG } from '../../config/config.module';

import { WidgetSessionObject } from '../dto/widget-session.object';
import { WidgetSessionUrlArgs } from '../dto/widget-session.args';
import { WidgetSessionInput } from '../dto/widget-session.input';
import { CustomHttpService } from '../../shared/services/http.service';
import { WidgetConfig } from '../../algoan/dto/widget-config.objects';
import { LinxoConnectLinkService } from './linxo-link.service';

describe(LinxoConnectLinkService.name, () => {
  let linxoConnectLinkService: LinxoConnectLinkService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LinxoConnectLinkService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    linxoConnectLinkService = await moduleRef.resolve<LinxoConnectLinkService>(LinxoConnectLinkService, contextId);
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', async () => {
    expect(linxoConnectLinkService).toBeDefined();
  });

  it('should return a link', async () => {
    const data: WidgetSessionObject = {
      session_id: `session_id-${process.pid}`,
      _links: {
        add_connection: `add_connection-${process.pid}`,
      },
    };

    const input: WidgetSessionInput = {
      access_token: `userAccessToken-${process.pid}`,
      client_id: `clientId-${process.pid}`,
      client_secret: `clientSecret-${process.pid}`,
    };

    const widgetSessionParams: WidgetSessionUrlArgs = {
      redirect_uri: `callbackUrl-${process.pid}`,
      aspsp_callback_uri: `connectionUrl-${process.pid}`,
      consent_per_account: true,
      wait_sync_end: true,
      locale: 'en_EN',
      font: 'Arial',
      font_color: 'Blue',
    };

    const widgetConfig: WidgetConfig = {
      iframe: {
        locale: 'en_EN',
        font: 'Arial',
        fontColor: 'Blue',
      },
    };

    const spy = jest
      .spyOn(customHttpService, 'post')
      .mockResolvedValue(Promise.resolve({ data } as unknown as AxiosResponse<WidgetSessionObject>));

    const link: string = await linxoConnectLinkService.getIframeUrl(
      `userAccessToken-${process.pid}`,
      `clientId-${process.pid}`,
      `clientSecret-${process.pid}`,
      `connectionUrl-${process.pid}`,
      `callbackUrl-${process.pid}`,
      widgetConfig,
    );

    expect(spy).toHaveBeenCalledWith(config.linxoConnect.embedBaseUrl, '/widget/widget_session', input);
    expect(link).toBe(`add_connection-${process.pid}&${qs.stringify(widgetSessionParams)}`);
  });
});
