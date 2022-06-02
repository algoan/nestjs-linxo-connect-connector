/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Enum for the transaction type
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export enum LinxoConnectTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  INTEREST = 'INTEREST',
  DIVIDEND = 'DIVIDEND',
  BANK_FEE = 'BANK_FEE',
  DEPOSIT = 'DEPOSIT',
  ATM = 'ATM',
  POINT_OF_SALE = 'POINT_OF_SALE',
  CREDIT_CARD_PAYMENT = 'CREDIT_CARD_PAYMENT',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  POTENTIAL_TRANSFER = 'POTENTIAL_TRANSFER',
  CHECK = 'CHECK',
  ELECTRONIC_PAYMENT = 'ELECTRONIC_PAYMENT',
  CASH = 'CASH',
  DIRECT_DEPOSIT = 'DIRECT_DEPOSIT',
  DIRECT_DEBIT = 'DIRECT_DEBIT',
  REPEATING_PAYMENT = 'REPEATING_PAYMENT',
  OTHER = 'OTHER',
}

/**
 * Enum for the transaction origin
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export enum LinxoConnectTransactionOrigin {
  ORIGINAL = 'ORIGINAL',
  UPCOMING = 'UPCOMING',
  TRANSACTION = 'TRANSACTION',
  RECURRING = 'RECURRING',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Enum for the transaction status
 *
 * @link https://developers.oxlin.io/reference-accounts-api/#operation/getTransactions
 */
export enum LinxoConnectTransactionStatus {
  BOOKED = 'BOOKED',
  PENDING = 'PENDING',
  OTHER = 'OTHER',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}
