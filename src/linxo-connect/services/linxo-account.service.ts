/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';

import { LinxoConnectAccount } from '../dto/account.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { AccountArgs } from '../dto/account.args';
import { TransactionArgs } from '../dto/transaction.args';
import { LinxoConnectTransaction } from '../dto/transaction.object';

/**
 * Service to manage account
 */
@Injectable()
export class LinxoConnectAccountService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get all accounts for a connection
   *
   * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
   */
  public async getAllAccountsForConnection(
    userAccessToken: string,
    connectionId: string,
  ): Promise<LinxoConnectAccount[]> {
    const args: Omit<AccountArgs, 'page'> = {
      connection_id: connectionId,
      limit: 100,
    };

    const getAllPagesOfAccountsStarting = async (page: number): Promise<LinxoConnectAccount[]> => {
      const response: AxiosResponse<LinxoConnectAccount[]> = await this.customHttpService.get<
        LinxoConnectAccount[],
        AccountArgs
      >(
        this.config.linxoConnect.apiBaseUrl,
        `/accounts`,
        {
          ...args,
          page,
        },
        userAccessToken,
      );

      if (response.data.length < args.limit) {
        return response.data;
      }

      return [...response.data, ...(await getAllPagesOfAccountsStarting(page + 1))];
    };

    return getAllPagesOfAccountsStarting(1);
  }

  /**
   * Get all transactions for an account
   *
   * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
   */
  public async getAllTransactionsForAccount(
    userAccessToken: string,
    accountId: string,
  ): Promise<LinxoConnectTransaction[]> {
    const args: Omit<TransactionArgs, 'page'> = {
      account_id: accountId,
      limit: 500,
    };

    const getAllPagesOfTransactionsStarting = async (page: number): Promise<LinxoConnectTransaction[]> => {
      const response: AxiosResponse<LinxoConnectTransaction[]> = await this.customHttpService.get<
        LinxoConnectTransaction[],
        TransactionArgs
      >(
        this.config.linxoConnect.apiBaseUrl,
        `/transactions`,
        {
          ...args,
          page,
        },
        userAccessToken,
      );

      if (response.data.length < args.limit) {
        return response.data;
      }

      return [...response.data, ...(await getAllPagesOfTransactionsStarting(page + 1))];
    };

    return getAllPagesOfTransactionsStarting(1);
  }

  /**
   * Get all transactions for all accounts
   */
  public async getAllTransactionsForAllAccounts(
    userAccessToken: string,
    accountIds: string[],
  ): Promise<LinxoConnectTransaction[]> {
    const transactions: LinxoConnectTransaction[] = [];
    for (const accountId of accountIds) {
      transactions.push(...(await this.getAllTransactionsForAccount(userAccessToken, accountId)));
    }

    return transactions;
  }
}
