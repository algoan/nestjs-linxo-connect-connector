/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */

import { OxlinAccountStatus, OxlinAccountType, OxlinAccountUsage } from './account.enums';
import { OxlinAccount } from './account.object';

/**
 * Oxlin Account Mock
 */
export const oxlinAccountMock: OxlinAccount = {
  id: `accountId-${process.pid}`,
  connection_id: 'string',
  name: 'string',
  account_number: 'string',
  iban: 'string',
  balance: 0,
  currency: 'string',
  balance_date: 0,
  type: OxlinAccountType.CHECKINGS,
  status: OxlinAccountStatus.ACTIVE,
  classification: OxlinAccountUsage.PERSONNAL,
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
 * Oxlin Accounts Mock
 */
export const oxlinAccountsMock: OxlinAccount[] = [
  {
    ...oxlinAccountMock,
    id: `${oxlinAccountMock.id}-1`,
  },
  {
    ...oxlinAccountMock,
    id: `${oxlinAccountMock.id}-2`,
  },
];
