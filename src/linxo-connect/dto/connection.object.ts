/* eslint-disable @typescript-eslint/naming-convention */

import { LinxoConnectConnectionStatus } from './connection.enums';

/**
 * LinxoConnect Connection
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getConnectionByIdUsingGET
 */
export interface LinxoConnectConnection {
  id: string;
  auto_sync: boolean;
  consent_per_account: boolean;
  creation_date: number; // timestamp in sec
  name: string;
  status: LinxoConnectConnectionStatus;
  channels: unknown[];
  constraints: unknown;
  logo_url: string;
  owner: unknown;
  provider_id: string;
  user_id: string;
}
