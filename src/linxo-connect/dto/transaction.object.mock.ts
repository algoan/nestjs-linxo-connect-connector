/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { linxoConnectAccountsMock } from './account.object.mock';
import {
  LinxoConnectTransactionOrigin,
  LinxoConnectTransactionStatus,
  LinxoConnectTransactionType,
} from './transaction.enums';
import { LinxoConnectTransaction } from './transaction.object';

/**
 * LinxoConnect Transaction Mock
 */
export const linxoConnectTransactionMock: LinxoConnectTransaction = {
  id: `transaction-${process.pid}`,
  account_id: 'string',
  amount: 0,
  original_trx_id: 'string',
  check_number: 'string',
  type: LinxoConnectTransactionType.ATM,
  origin: LinxoConnectTransactionOrigin.ORIGINAL,
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
  status: LinxoConnectTransactionStatus.BOOKED,
};

/**
 * LinxoConnect Transactions Mock
 */
export const linxoConnectTransactionsMock: LinxoConnectTransaction[] = [
  {
    ...linxoConnectTransactionMock,
    id: `${linxoConnectTransactionMock.id}-1`,
    account_id: linxoConnectAccountsMock[0].id,
  },
  {
    ...linxoConnectTransactionMock,
    id: `${linxoConnectTransactionMock.id}-2`,
    account_id: linxoConnectAccountsMock[1].id,
  },
];
