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
import { LinxoConnectUserService } from './linxo-user.service';

describe(LinxoConnectUserService.name, () => {
  let linxoConnectUserService: LinxoConnectUserService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        LinxoConnectUserService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    linxoConnectUserService = await moduleRef.resolve<LinxoConnectUserService>(LinxoConnectUserService, contextId);
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', () => {
    expect(linxoConnectUserService).toBeDefined();
  });

  describe('getUser', () => {
    it('should create get a user', async () => {
      const userMock: LinxoConnectUser = {
        id: `id-${process.pid}`,
        email: `email-${process.pid}`,
      };
      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValue(Promise.resolve({ data: userMock } as unknown as AxiosResponse<undefined>));

      const user: LinxoConnectUser = await linxoConnectUserService.getUser('token', userMock.id);

      expect(spy).toHaveBeenCalledWith(config.linxoConnect.apiBaseUrl, `/users/${userMock.id}`, undefined, 'token');
      expect(user).toBe(userMock);
    });
  });

  describe('createNewUser', () => {
    it('should create a new user', async () => {
      const spy = jest
        .spyOn(customHttpService, 'post')
        .mockResolvedValue(
          Promise.resolve({ headers: { location: '/users/1234' } } as unknown as AxiosResponse<undefined>),
        );
      const input: CreateUserInput = {
        email: 'toto',
        password: 'titi',
      };
      const userId: string = await linxoConnectUserService.createNewUser('token', input);

      expect(spy).toHaveBeenCalledWith(config.linxoConnect.apiBaseUrl, `/users`, input, 'token');
      expect(userId).toBe('1234');
    });

    it('should throw an error if no location header', async () => {
      jest
        .spyOn(customHttpService, 'post')
        .mockResolvedValue(Promise.resolve({ headers: {} } as unknown as AxiosResponse<undefined>));
      const input: CreateUserInput = {
        email: 'toto',
        password: 'titi',
      };
      await expect(linxoConnectUserService.createNewUser('token', input)).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Error while creating user"',
      );
    });
  });

  describe('deleteUser', () => {
    it('should create get a user', async () => {
      const spy = jest
        .spyOn(customHttpService, 'delete')
        .mockResolvedValue(Promise.resolve({ data: {} } as unknown as AxiosResponse<undefined>));

      await linxoConnectUserService.deleteUser('token', `id-${process.pid}`);

      expect(spy).toHaveBeenCalledWith(config.linxoConnect.apiBaseUrl, `/users/id-${process.pid}`, undefined, 'token');
    });
  });
});
