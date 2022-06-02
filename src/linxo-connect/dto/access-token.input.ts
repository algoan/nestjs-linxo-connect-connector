/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { AuthProviders, GrantType } from './grant-type.enum';

/**
 * Input to send to get a new access token
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#section/Authentication/OAuth
 */
export interface AccessTokenInput {
  provider: AuthProviders;
  client_id: string;
  client_secret: string;
  grant_type: GrantType;
  scope: string;

  username?: string;
  password?: string;
}
