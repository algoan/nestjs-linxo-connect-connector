/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Enum for the account type
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export enum OxlinAccountType {
  CHECKINGS = 'CHECKINGS',
  SAVINGS = 'SAVINGS',
  LOAN = 'LOAN',
  CREDIT_CARD = 'CREDIT_CARD',
}

/**
 * Enum for the account status
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export enum OxlinAccountStatus {
  MANUAL = 'MANUAL',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED',
  PENDING_CONSENT = 'PENDING_CONSENT',
}

/**
 * Enum for the account usage
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getAccounts
 */
export enum OxlinAccountUsage {
  PERSONNAL = 'PERSONNAL',
  PROFESSIONAL = 'PROFESSIONAL',
}
