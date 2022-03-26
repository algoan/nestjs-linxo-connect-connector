/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { OxlinConnectionStatus } from './connection.enums';
import { OxlinConnection } from './connection.object';

/**
 * Oxlin Connection Mock
 */
export const oxlinConnectionMock: OxlinConnection = {
  id: 'string',
  auto_sync: true,
  consent_per_account: true,
  creation_date: 0,
  name: 'string',
  status: OxlinConnectionStatus.SUCCESS,
  channels: [],
  constraints: {},
  logo_url: 'string',
  owner: {},
  provider_id: 'string',
  user_id: 'string',
};
