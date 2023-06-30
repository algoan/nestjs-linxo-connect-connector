/* eslint-disable no-magic-numbers */
/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { createMock } from '@golevelup/ts-jest';
import { ContextIdFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';

import { CustomHttpService } from '../../shared/services/http.service';
import { LinxoConnectAccount } from '../dto/account.object';
import { Env } from '../dto/env.enums';
import { LinxoConnectTransaction } from '../dto/transaction.object';
import { LinxoConnectAccountService } from './linxo-account.service';

describe(LinxoConnectAccountService.name, () => {
  let linxoConnectAccountService: LinxoConnectAccountService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CustomHttpService,
        LinxoConnectAccountService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    linxoConnectAccountService = await moduleRef.resolve<LinxoConnectAccountService>(
      LinxoConnectAccountService,
      contextId,
    );
    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
  });

  it('should be defined', () => {
    expect(linxoConnectAccountService).toBeDefined();
  });

  describe('getAllAccountsForConnection', () => {
    it('should get all accounts for a connection', async () => {
      const acccountsMock: LinxoConnectAccount[] = new Array(99).fill({ id: 'id' });

      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValue(Promise.resolve({ data: acccountsMock } as unknown as AxiosResponse<LinxoConnectAccount[]>));

      const acccounts: LinxoConnectAccount[] = await linxoConnectAccountService.getAllAccountsForConnection(
        'token',
        `connectionId`,
        Env.sandbox,
      );

      expect(spy).toHaveBeenCalledWith(
        config.linxoConnect.sandbox.apiBaseUrl,
        `/accounts`,
        {
          connection_id: 'connectionId',
          page: 1,
          limit: 100,
        },
        'token',
      );
      expect(acccounts).toBe(acccountsMock);
    });

    it('should get all accounts for a connection, even if there is mulitple page', async () => {
      const acccountsMock: LinxoConnectAccount[] = new Array(100).fill({ id: 'id' });

      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValueOnce(
          Promise.resolve({ data: acccountsMock } as unknown as AxiosResponse<LinxoConnectAccount[]>),
        )
        .mockResolvedValueOnce(
          Promise.resolve({ data: acccountsMock } as unknown as AxiosResponse<LinxoConnectAccount[]>),
        )
        .mockResolvedValueOnce(
          Promise.resolve({ data: acccountsMock.slice(0, 99) } as unknown as AxiosResponse<LinxoConnectAccount[]>),
        );

      const acccounts: LinxoConnectAccount[] = await linxoConnectAccountService.getAllAccountsForConnection(
        'token',
        `connectionId`,
        Env.sandbox,
      );

      expect(spy).toHaveBeenCalledTimes(3);
      expect(acccounts.length).toEqual(299);
    });
  });

  describe('getAllTransactionsForAccount', () => {
    it('should get all transactions for an account', async () => {
      const transactionsMock: LinxoConnectTransaction[] = new Array(99).fill({ id: 'id' });

      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValue(
          Promise.resolve({ data: transactionsMock } as unknown as AxiosResponse<LinxoConnectTransaction[]>),
        );

      const transactions: LinxoConnectTransaction[] = await linxoConnectAccountService.getAllTransactionsForAccount(
        'token',
        `accountId`,
        Env.sandbox,
      );

      expect(spy).toHaveBeenCalledWith(
        config.linxoConnect.sandbox.apiBaseUrl,
        `/transactions`,
        {
          account_id: 'accountId',
          page: 1,
          limit: 500,
        },
        'token',
      );
      expect(transactions).toBe(transactionsMock);
    });

    it('should get all transactions for an account, even if there is mulitple page', async () => {
      const transactionsMock: LinxoConnectTransaction[] = new Array(500).fill({ id: 'id' });

      const spy = jest
        .spyOn(customHttpService, 'get')
        .mockResolvedValueOnce(
          Promise.resolve({ data: transactionsMock } as unknown as AxiosResponse<LinxoConnectTransaction[]>),
        )
        .mockResolvedValueOnce(
          Promise.resolve({ data: transactionsMock } as unknown as AxiosResponse<LinxoConnectTransaction[]>),
        )
        .mockResolvedValueOnce(
          Promise.resolve({ data: transactionsMock.slice(0, 499) } as unknown as AxiosResponse<
            LinxoConnectTransaction[]
          >),
        );

      const transactions: LinxoConnectTransaction[] = await linxoConnectAccountService.getAllTransactionsForAccount(
        'token',
        `accountId`,
        Env.sandbox,
      );

      expect(spy).toHaveBeenCalledTimes(3);
      expect(transactions.length).toEqual(1499);
    });
  });

  describe('getAllTransactionsForAllAccounts', () => {
    it('should get all transactions for all accounts', async () => {
      const transactionsMock: LinxoConnectTransaction[] = new Array(99).fill({ id: 'id' });

      const spy = jest
        .spyOn(linxoConnectAccountService, 'getAllTransactionsForAccount')
        .mockResolvedValue(transactionsMock as unknown as LinxoConnectTransaction[]);

      const transactions: LinxoConnectTransaction[] = await linxoConnectAccountService.getAllTransactionsForAllAccounts(
        'token',
        [`accountId-1`, `accountId-2`],
        Env.sandbox,
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(transactions.length).toBe(transactionsMock.length * 2);
    });
  });
});
