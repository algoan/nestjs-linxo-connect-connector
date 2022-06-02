/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/naming-convention */
import { LinxoConnectConnectionStatus } from './connection.enums';
import { LinxoConnectConnection } from './connection.object';

/**
 * LinxoConnect Connection Mock
 */
export const linxoConnectConnectionMock: LinxoConnectConnection = {
  id: 'string',
  auto_sync: true,
  consent_per_account: true,
  creation_date: 0,
  name: 'string',
  status: LinxoConnectConnectionStatus.SUCCESS,
  channels: [],
  constraints: {},
  logo_url: 'string',
  owner: {},
  provider_id: 'string',
  user_id: 'string',
};
