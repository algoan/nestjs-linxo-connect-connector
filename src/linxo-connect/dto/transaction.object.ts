/* eslint-disable @typescript-eslint/naming-convention */

import {
  LinxoConnectTransactionOrigin,
  LinxoConnectTransactionStatus,
  LinxoConnectTransactionType,
} from './transaction.enums';

/**
 * LinxoConnect Transaction
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export interface LinxoConnectTransaction {
  id: string;
  account_id: string;
  amount: number;
  original_trx_id: string;
  check_number: string;
  type: LinxoConnectTransactionType;
  origin: LinxoConnectTransactionOrigin;
  category_id: string;
  date: number;
  import_date: number;
  booking_date: number;
  transaction_date: number;
  value_date: number;
  label: string;
  notes: string;
  source: unknown;
  currency: string;
  remittance_information: unknown[];
  status: LinxoConnectTransactionStatus;
}
