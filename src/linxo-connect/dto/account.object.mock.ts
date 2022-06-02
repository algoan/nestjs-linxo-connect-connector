/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */

import { LinxoConnectAccountStatus, LinxoConnectAccountType, LinxoConnectAccountUsage } from './account.enums';
import { LinxoConnectAccount } from './account.object';

/**
 * LinxoConnect Account Mock
 */
export const linxoConnectAccountMock: LinxoConnectAccount = {
  id: `accountId-${process.pid}`,
  connection_id: 'string',
  name: 'string',
  account_number: 'string',
  iban: 'string',
  balance: 0,
  currency: 'string',
  balance_date: 0,
  type: LinxoConnectAccountType.CHECKINGS,
  status: LinxoConnectAccountStatus.ACTIVE,
  classification: LinxoConnectAccountUsage.PERSONNAL,
  creation_date: 0,
  loan: {},
  savings: {},
  credit_card: {},
  owner: {},
  usage: 'string',
  group: 'string',
  last_channel_definition_id: 'string',
};

/**
 * LinxoConnect Accounts Mock
 */
export const linxoConnectAccountsMock: LinxoConnectAccount[] = [
  {
    ...linxoConnectAccountMock,
    id: `${linxoConnectAccountMock.id}-1`,
  },
  {
    ...linxoConnectAccountMock,
    id: `${linxoConnectAccountMock.id}-2`,
  },
];
