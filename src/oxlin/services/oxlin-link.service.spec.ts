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
import { OxlinLinkService } from './oxlin-link.service';

describe(OxlinLinkService.name, () => {
  let oxlinLinkService: OxlinLinkService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OxlinLinkService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    oxlinLinkService = await moduleRef.resolve<OxlinLinkService>(OxlinLinkService, contextId);
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', async () => {
    expect(oxlinLinkService).toBeDefined();
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
    };

    const spy = jest
      .spyOn(customHttpService, 'post')
      .mockReturnValue(Promise.resolve({ data } as unknown as AxiosResponse<WidgetSessionObject>));

    const link: string = await oxlinLinkService.getIframeUrl(
      `userAccessToken-${process.pid}`,
      `clientId-${process.pid}`,
      `clientSecret-${process.pid}`,
      `connectionUrl-${process.pid}`,
      `callbackUrl-${process.pid}`,
    );

    expect(spy).toHaveBeenCalledWith(config.oxlin.embedBaseUrl, '/widget/widget_session', input);
    expect(link).toBe(`add_connection-${process.pid}&${qs.stringify(widgetSessionParams)}`);
  });
});
