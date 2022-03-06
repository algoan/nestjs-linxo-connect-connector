/* eslint-disable @typescript-eslint/naming-convention,camelcase */

/**
 * Input to create a new user
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/createUser
 */
export interface CreateUserInput {
  email: string;
  password: string;
}
