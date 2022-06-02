/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { LinxoConnectAccountStatus, LinxoConnectAccountType, LinxoConnectAccountUsage } from './account.enums';

/**
 * Args to get accounts
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export interface AccountArgs {
  type?: LinxoConnectAccountType;
  q?: string;
  page: number;
  limit: number;
  status?: LinxoConnectAccountStatus;
  connection_id: string;
  usage?: LinxoConnectAccountUsage;
  sort?: string;
}
