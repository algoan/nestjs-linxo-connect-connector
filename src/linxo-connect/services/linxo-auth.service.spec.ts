/* eslint-disable @typescript-eslint/naming-convention,camelcase */
import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { config } from 'node-config-ts';
import { of } from 'rxjs';
import { ContextIdFactory } from '@nestjs/core';

import { CustomHttpService } from '../../shared/services/http.service';
import { SharedModule } from '../../shared/shared.module';
import { serviceAccountConfigMock } from '../../algoan/dto/service-account.objects.mock';
import { CONFIG } from '../../config/config.module';

import { AccessTokenInput } from '../dto/access-token.input';
import { AuthProviders, GrantType } from '../dto/grant-type.enum';

import { AccessTokenObject } from '../dto/access-token.object';
import { LinxoConnectAuthService } from './linxo-auth.service';

describe(LinxoConnectAuthService.name, () => {
  let linxoConnectAuthService: LinxoConnectAuthService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [SharedModule],
      providers: [
        LinxoConnectAuthService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    linxoConnectAuthService = await moduleRef.resolve<LinxoConnectAuthService>(LinxoConnectAuthService, contextId);
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', () => {
    expect(linxoConnectAuthService).toBeDefined();
  });

  describe('getClientToken', () => {
    let spy;

    beforeEach(async () => {
      spy = jest
        .spyOn(customHttpService, 'post')
        .mockResolvedValue({ data: { access_token: `token-${process.pid}` } } as AxiosResponse<AccessTokenObject>);
    });

    it('should request a client token', async () => {
      const url: string = `${config.linxoConnect.authBaseUrl}`;
      const input: AccessTokenInput = {
        provider: AuthProviders.LINXO_CONNECT,
        client_id: serviceAccountConfigMock.clientId,
        client_secret: serviceAccountConfigMock.clientSecret,
        grant_type: GrantType.CLIENT_CREDENTIALS,
        scope: 'users_create',
      };

      const token: string = await linxoConnectAuthService.geClientToken(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
      );

      expect(spy).toHaveBeenCalledWith(url, '/token', input);
      expect(token).toEqual(`token-${process.pid}`);
    });
  });

  describe('getUserToken', () => {
    let spy;

    beforeEach(async () => {
      spy = jest
        .spyOn(customHttpService, 'post')
        .mockResolvedValue({ data: { access_token: `token-${process.pid}` } } as AxiosResponse<AccessTokenObject>);
    });

    it('should request a user token', async () => {
      const url: string = `${config.linxoConnect.authBaseUrl}`;
      const input: AccessTokenInput = {
        provider: AuthProviders.LINXO_CONNECT,
        client_id: serviceAccountConfigMock.clientId,
        client_secret: serviceAccountConfigMock.clientSecret,
        grant_type: GrantType.PASSWORD,
        scope: 'profile profile_edit accounts_manage connections_manage connections_sync transactions_read',

        username: 'email@algoan.com',
        password: 'thisIsAStringPassword',
      };

      const token: string = await linxoConnectAuthService.getUserToken(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        'email@algoan.com',
        'thisIsAStringPassword',
      );

      expect(spy).toHaveBeenCalledWith(url, '/token', input);
      expect(token).toEqual(`token-${process.pid}`);
    });
  });
});
