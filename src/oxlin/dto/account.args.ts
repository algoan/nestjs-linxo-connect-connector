/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { OxlinAccountStatus, OxlinAccountType, OxlinAccountUsage } from './account.enums';

/**
 * Args to get accounts
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export interface AccountArgs {
  type?: OxlinAccountType;
  q?: string;
  page: number;
  limit: number;
  status?: OxlinAccountStatus;
  connection_id: string;
  usage?: OxlinAccountUsage;
  sort?: string;
}
