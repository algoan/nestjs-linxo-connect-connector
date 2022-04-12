/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { oxlinAccountsMock } from './account.object.mock';
import { OxlinTransactionOrigin, OxlinTransactionStatus, OxlinTransactionType } from './transaction.enums';
import { OxlinTransaction } from './transaction.object';

/**
 * Oxlin Transaction Mock
 */
export const oxlinTransactionMock: OxlinTransaction = {
  id: `transaction-${process.pid}`,
  account_id: 'string',
  amount: 0,
  original_trx_id: 'string',
  check_number: 'string',
  type: OxlinTransactionType.ATM,
  origin: OxlinTransactionOrigin.ORIGINAL,
  category_id: 'string',
  date: 0,
  import_date: 0,
  booking_date: 0,
  transaction_date: 0,
  value_date: 0,
  label: 'string',
  notes: 'string',
  source: {},
  currency: 'string',
  remittance_information: [],
  status: OxlinTransactionStatus.BOOKED,
};

/**
 * Oxlin Transactions Mock
 */
export const oxlinTransactionsMock: OxlinTransaction[] = [
  {
    ...oxlinTransactionMock,
    id: `${oxlinTransactionMock.id}-1`,
    account_id: oxlinAccountsMock[0].id,
  },
  {
    ...oxlinTransactionMock,
    id: `${oxlinTransactionMock.id}-2`,
    account_id: oxlinAccountsMock[1].id,
  },
];
