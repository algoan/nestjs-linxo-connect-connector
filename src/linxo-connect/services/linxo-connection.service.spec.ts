/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { createMock } from '@golevelup/ts-jest';
import { ContextIdFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';
import { CreateUserInput } from '../dto/create-user.input';
import { LinxoConnectUser } from '../dto/user.object';

import { CustomHttpService } from '../../shared/services/http.service';
import { LinxoConnectConnection } from '../dto/connection.object';
import { LinxoConnectConnectionStatus } from '../dto/connection.enums';
import { LinxoConnectConnectionService } from './linxo-connection.service';

describe(LinxoConnectConnectionService.name, () => {
  let linxoConnectConnectionService: LinxoConnectConnectionService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        LinxoConnectConnectionService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    linxoConnectConnectionService = await moduleRef.resolve<LinxoConnectConnectionService>(
      LinxoConnectConnectionService,
      contextId,
    );
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', () => {
    expect(linxoConnectConnectionService).toBeDefined();
  });

  describe('getConnection', () => {
    it('should get a single connection', async () => {
      const connectionMock: Pick<LinxoConnectConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: LinxoConnectConnectionStatus.SUCCESS,
      };
      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValue(
          Promise.resolve({ data: connectionMock } as unknown as AxiosResponse<LinxoConnectConnection>),
        );

      const connection: LinxoConnectConnection = await linxoConnectConnectionService.getConnection(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
      );

      expect(spy).toHaveBeenCalledWith(
        config.linxoConnect.apiBaseUrl,
        `/connections/${connectionMock.id}`,
        undefined,
        'token',
        {
          headers: {
            'x-linxo-user-id': `userId-${process.pid}`,
            'x-scope': 'accounts_read transactions_read',
          },
        },
      );
      expect(connection).toBe(connectionMock);
    });
  });

  describe('getConnectionWithFinalStatus', () => {
    it('should get a single connection when the status is in final step SUCCESS', async () => {
      const connectionMock: Pick<LinxoConnectConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: LinxoConnectConnectionStatus.SUCCESS,
      };

      const spy = jest
        .spyOn(linxoConnectConnectionService, 'getConnection')
        .mockResolvedValue(connectionMock as unknown as LinxoConnectConnection);

      const connection: LinxoConnectConnection = await linxoConnectConnectionService.getConnectionWithFinalStatus(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
        60_000,
      );

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('token', `userId-${process.pid}`, connectionMock.id);
      expect(connection).toBe(connectionMock);
    });

    it('should get a single connection when the status is in final step FAILED', async () => {
      const connectionMock: Pick<LinxoConnectConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: LinxoConnectConnectionStatus.FAILED,
      };

      const spy = jest
        .spyOn(linxoConnectConnectionService, 'getConnection')
        .mockResolvedValue(connectionMock as unknown as LinxoConnectConnection);

      const connection: LinxoConnectConnection = await linxoConnectConnectionService.getConnectionWithFinalStatus(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
        60_000,
      );

      expect(spy).toBeCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('token', `userId-${process.pid}`, connectionMock.id);
      expect(connection).toBe(connectionMock);
    });

    it('should get a single connection UNTIL the status is in final step', async () => {
      const connectionMock: Pick<LinxoConnectConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: LinxoConnectConnectionStatus.SUCCESS,
      };

      const spy = jest
        .spyOn(linxoConnectConnectionService, 'getConnection')
        .mockResolvedValueOnce({
          ...connectionMock,
          status: LinxoConnectConnectionStatus.RUNNING,
        } as unknown as LinxoConnectConnection)
        .mockResolvedValueOnce(connectionMock as unknown as LinxoConnectConnection);

      const connection: LinxoConnectConnection = await linxoConnectConnectionService.getConnectionWithFinalStatus(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
        60_000,
      );

      expect(spy).toBeCalledTimes(2);
      expect(connection).toBe(connectionMock);
    });

    it('should throw an error if timeout', async () => {
      const connectionMock: Pick<LinxoConnectConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: LinxoConnectConnectionStatus.RUNNING,
      };

      const spy = jest
        .spyOn(linxoConnectConnectionService, 'getConnection')
        .mockResolvedValueOnce(connectionMock as unknown as LinxoConnectConnection);

      await expect(
        linxoConnectConnectionService.getConnectionWithFinalStatus(
          'token',
          `userId-${process.pid}`,
          connectionMock.id,
          1000,
        ),
      ).rejects.toThrowError('Connection final status take too long');
    });
  });
});
