/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import * as assert from 'assert';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as nock from 'nock';
import { config } from 'node-config-ts';

import { AppModule } from '../../src/app.module';
import { fakeAPI } from './fake-server';

export const fakeAlgoanBaseUrl: string = config.algoan.baseUrl;

/**
 * Build a fake nest application
 */
export const buildFakeApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();

  /**
   * Create fake servers to init resthooks
   */
  const fakeOAuthServer: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'post',
    result: {
      access_token: 'token',
      refresh_token: 'refresh_token',
      expires_in: 3000,
      refresh_expires_in: 10000,
    },
    path: '/v2/oauth/token',
    nbOfCalls: 2,
  });
  const fakeServiceAccounts: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'get',
    result: {
      resources: [
        {
          clientId: 'client1',
          clientSecret: 'secret',
          id: 'id1',
          config: {
            clientId: 'linxoConnectclientId',
            clientSecret: 'linxoConnectClientSecret',
            connectionUrl: 'http://localhost:4000',
            finalConnectionTimeoutInMS: 10000,
          },
        },
      ],
    },
    path: '/v2/service-accounts?limit=1000',
  });
  const fakeGetSubscriptions: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'get',
    result: [],
    path: `/v1/subscriptions?filter=${JSON.stringify({
      eventName: { $in: config.eventList },
    })}`,
  });
  const fakePostSubscriptions1: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'post',
    result: { id: '1', eventName: 'aggregator_link_required', target: 'http://...' },
    path: '/v1/subscriptions',
  });

  const fakePostSubscriptions2: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'post',
    result: { id: '1', eventName: 'bank_details_required', target: 'http://...' },
    path: '/v1/subscriptions',
  });

  const fakePostSubscriptions3: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'post',
    result: { id: '1', eventName: 'service_account_created', target: 'http://...' },
    path: '/v1/subscriptions',
  });

  const fakePostSubscriptions4: nock.Scope = fakeAPI({
    baseUrl: fakeAlgoanBaseUrl,
    method: 'post',
    result: { id: '1', eventName: 'service_account_updated', target: 'http://...' },
    path: '/v1/subscriptions',
  });

  /**
   * Attach global dependencies
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * If set to true, validator will strip validated (returned)
       * object of any properties that do not use any validation decorators.
       */
      whitelist: true,
    }),
  );

  await app.init();

  assert.strictEqual(fakeOAuthServer.isDone(), true);
  assert.strictEqual(fakeServiceAccounts.isDone(), true);
  assert.strictEqual(fakeGetSubscriptions.isDone(), true);
  assert.strictEqual(fakePostSubscriptions1.isDone(), true);
  assert.strictEqual(fakePostSubscriptions2.isDone(), true);
  assert.strictEqual(fakePostSubscriptions3.isDone(), true);
  assert.strictEqual(fakePostSubscriptions4.isDone(), true);

  return app;
};
