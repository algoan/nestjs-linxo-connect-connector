/* eslint-disable @typescript-eslint/naming-convention, camelcase */

import { GrantType } from './grant-type.enum';

/**
 * Object when we request a new access token
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#section/Authentication/OAuth
 */
export interface AccessTokenObject {
  access_token: string;
  token_type: string;
  expires_in: number;
}
