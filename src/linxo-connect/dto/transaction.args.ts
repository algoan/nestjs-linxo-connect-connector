/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { LinxoConnectAccountType } from './account.enums';

/**
 * Args to get transactions
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export interface TransactionArgs {
  account_id: string;
  page: number;
  limit: number; // Max 500
  origin?: 'TRANSACTION';
  included_statuses?: string; // LinxoConnectTransactionStatus separated by comma
  excluded_statuses?: string; // LinxoConnectTransactionStatus separated by comma
  min_amount?: number;
  max_amount?: number;
  amount?: number;
  account_type?: LinxoConnectAccountType;
  start_date?: number;
  end_date?: number;
  category_id?: string;
  start_import_date?: number;
}
