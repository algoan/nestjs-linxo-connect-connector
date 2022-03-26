/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';

import { OxlinAccount } from '../dto/account.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { AccountArgs } from '../dto/account.args';
import { OxlinAccountUsage } from '../dto/account.enums';
import { TransactionArgs } from '../dto/transaction.args';
import { OxlinTransaction } from '../dto/transaction.object';

/**
 * Service to manage account
 */
@Injectable()
export class OxlinAccountService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get all accounts for a connection
   *
   * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
   */
  public async getAllAccountsForConnection(userAccessToken: string, connectionId: string): Promise<OxlinAccount[]> {
    const args: Omit<AccountArgs, 'page'> = {
      connection_id: connectionId,
      usage: OxlinAccountUsage.PERSONNAL,
      limit: 100,
    };

    const getAllPagesOfAccountsStarting = async (page: number): Promise<OxlinAccount[]> => {
      const response: AxiosResponse<OxlinAccount[]> = await this.customHttpService.get<OxlinAccount[], AccountArgs>(
        this.config.oxlin.apiBaseUrl,
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
  public async getAllTransactionsForAccount(userAccessToken: string, accountId: string): Promise<OxlinTransaction[]> {
    const args: Omit<TransactionArgs, 'page'> = {
      account_id: accountId,
      limit: 500,
    };

    const getAllPagesOfTransactionsStarting = async (page: number): Promise<OxlinTransaction[]> => {
      const response: AxiosResponse<OxlinTransaction[]> = await this.customHttpService.get<
        OxlinTransaction[],
        TransactionArgs
      >(
        this.config.oxlin.apiBaseUrl,
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
  ): Promise<OxlinTransaction[]> {
    const transactions: OxlinTransaction[] = [];
    for (const accountId of accountIds) {
      transactions.push(...(await this.getAllTransactionsForAccount(userAccessToken, accountId)));
    }

    return transactions;
  }
}
