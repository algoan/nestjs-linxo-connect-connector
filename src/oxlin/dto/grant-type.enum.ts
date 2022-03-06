/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Enum for the grant type field when get an access token
 *
 * @link https://developers.oxlin.io/docs/accounts-api-quickstart/#1-client-authenticationw
 */
export enum GrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
  PASSWORD = 'password',
}

/**
 * Enum for the providers field when get a user access token
 *
 * @link https://developers.oxlin.io/docs/accounts-api-quickstart#3-user-authentication
 */
export enum AuthProviders {
  LINXO_CONNECT = 'linxoConnect',
}
