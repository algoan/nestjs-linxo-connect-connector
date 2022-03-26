import { ClientConfig } from './service-account.objects';

/**
 * Client Config
 */
export const serviceAccountConfigMock: ClientConfig = {
  clientId: 'clientId',
  clientSecret: 'clientSecret',
  connectionUrl: 'http://localhost:4000',
  finalConnectionTimeoutInMS: 60_000,
};
