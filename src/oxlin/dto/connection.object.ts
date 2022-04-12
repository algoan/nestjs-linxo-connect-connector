/* eslint-disable @typescript-eslint/naming-convention */

import { OxlinConnectionStatus } from './connection.enums';

/**
 * Oxlin Connection
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getConnectionByIdUsingGET
 */
export interface OxlinConnection {
  id: string;
  auto_sync: boolean;
  consent_per_account: boolean;
  creation_date: number; // timestamp in sec
  name: string;
  status: OxlinConnectionStatus;
  channels: unknown[];
  constraints: unknown;
  logo_url: string;
  owner: unknown;
  provider_id: string;
  user_id: string;
}
