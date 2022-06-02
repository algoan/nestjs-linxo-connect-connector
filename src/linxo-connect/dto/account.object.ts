/* eslint-disable @typescript-eslint/naming-convention */

import { LinxoConnectAccountStatus, LinxoConnectAccountType, LinxoConnectAccountUsage } from './account.enums';

/**
 * LinxoConnect Account
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export interface LinxoConnectAccount {
  connection_id: string;
  name: string;
  account_number: string;
  iban: string;
  balance: number;
  currency: string;
  balance_date: number;
  type: LinxoConnectAccountType;
  status: LinxoConnectAccountStatus;
  classification: LinxoConnectAccountUsage;
  creation_date: number;
  loan: unknown;
  savings: unknown;
  credit_card: unknown;
  owner: unknown;
  usage: string;
  group: string;
  last_channel_definition_id: string;
  id: string;
}
