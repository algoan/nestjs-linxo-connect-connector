/* eslint-disable @typescript-eslint/naming-convention */

import { OxlinTransactionOrigin, OxlinTransactionStatus, OxlinTransactionType } from './transaction.enums';

/**
 * Oxlin Transaction
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export interface OxlinTransaction {
  id: string;
  account_id: string;
  amount: number;
  original_trx_id: string;
  check_number: string;
  type: OxlinTransactionType;
  origin: OxlinTransactionOrigin;
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
  status: OxlinTransactionStatus;
}
