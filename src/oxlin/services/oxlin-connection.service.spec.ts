/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { createMock } from '@golevelup/ts-jest';
import { ContextIdFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';
import { CreateUserInput } from '../dto/create-user.input';
import { OxlinUser } from '../dto/user.object';

import { CustomHttpService } from '../../shared/services/http.service';
import { OxlinConnection } from '../dto/connection.object';
import { OxlinConnectionStatus } from '../dto/connection.enums';
import { OxlinConnectionService } from './oxlin-connection.service';

describe(OxlinConnectionService.name, () => {
  let oxlinConnectionService: OxlinConnectionService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        OxlinConnectionService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    oxlinConnectionService = await moduleRef.resolve<OxlinConnectionService>(OxlinConnectionService, contextId);
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', () => {
    expect(oxlinConnectionService).toBeDefined();
  });

  describe('getConnection', () => {
    it('should get a single connection', async () => {
      const connectionMock: Pick<OxlinConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: OxlinConnectionStatus.SUCCESS,
      };
      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValue(Promise.resolve({ data: connectionMock } as unknown as AxiosResponse<OxlinConnection>));

      const connection: OxlinConnection = await oxlinConnectionService.getConnection(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
      );

      expect(spy).toHaveBeenCalledWith(
        config.oxlin.apiBaseUrl,
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
      const connectionMock: Pick<OxlinConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: OxlinConnectionStatus.SUCCESS,
      };

      const spy = jest
        .spyOn(oxlinConnectionService, 'getConnection')
        .mockResolvedValue(connectionMock as unknown as OxlinConnection);

      const connection: OxlinConnection = await oxlinConnectionService.getConnectionWithFinalStatus(
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
      const connectionMock: Pick<OxlinConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: OxlinConnectionStatus.FAILED,
      };

      const spy = jest
        .spyOn(oxlinConnectionService, 'getConnection')
        .mockResolvedValue(connectionMock as unknown as OxlinConnection);

      const connection: OxlinConnection = await oxlinConnectionService.getConnectionWithFinalStatus(
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
      const connectionMock: Pick<OxlinConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: OxlinConnectionStatus.SUCCESS,
      };

      const spy = jest
        .spyOn(oxlinConnectionService, 'getConnection')
        .mockResolvedValueOnce({
          ...connectionMock,
          status: OxlinConnectionStatus.RUNNING,
        } as unknown as OxlinConnection)
        .mockResolvedValueOnce(connectionMock as unknown as OxlinConnection);

      const connection: OxlinConnection = await oxlinConnectionService.getConnectionWithFinalStatus(
        'token',
        `userId-${process.pid}`,
        connectionMock.id,
        60_000,
      );

      expect(spy).toBeCalledTimes(2);
      expect(connection).toBe(connectionMock);
    });

    it('should throw an error if timeout', async () => {
      const connectionMock: Pick<OxlinConnection, 'id' | 'status'> = {
        id: `id-${process.pid}`,
        status: OxlinConnectionStatus.RUNNING,
      };

      const spy = jest
        .spyOn(oxlinConnectionService, 'getConnection')
        .mockResolvedValueOnce(connectionMock as unknown as OxlinConnection);

      await expect(
        oxlinConnectionService.getConnectionWithFinalStatus('token', `userId-${process.pid}`, connectionMock.id, 1000),
      ).rejects.toThrowError('Connection final status take too long');
    });
  });
});
