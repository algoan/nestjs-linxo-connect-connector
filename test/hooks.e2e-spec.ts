/* eslint-disable @typescript-eslint/naming-convention,camelcase */
/* eslint-disable arrow-body-style */
import { INestApplication, HttpStatus } from '@nestjs/common';
import { config } from 'node-config-ts';
import * as request from 'supertest';
import { AggregationDetailsAggregatorName, AggregationDetailsMode } from '../src/algoan/dto/customer.enums';
import { buildFakeApp, fakeAlgoanBaseUrl } from './utils/app';
import { fakeAPI } from './utils/fake-server';

describe('HooksController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await buildFakeApp();
  });

  describe('POST /hooks', () => {
    it('HK001 - should be a bad request - no request body', async () => {
      return request(app.getHttpServer()).post('/hooks').send({}).expect(HttpStatus.BAD_REQUEST);
    });

    it('HK002 - should be a bad request - no event id', async () => {
      return request(app.getHttpServer())
        .post('/hooks')
        .send({
          subscription: {
            id: '1',
          },
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('HK003 - should be unauthorized - no service account found', async () => {
      return request(app.getHttpServer())
        .post('/hooks')
        .send({
          subscription: {
            id: 'unknown',
            target: 'http://',
            status: 'ACTIVE',
            eventName: 'aggregator_link_required',
          },
          id: 'random',
          index: 1,
          time: Date.now(),
          payload: {
            banksUserId: 'banks_user_id',
            applicationId: 'app_id',
          },
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    fit('HK004 - should be ok', async () => {
      fakeAPI({
        baseUrl: fakeAlgoanBaseUrl,
        method: 'patch',
        result: { status: 'PROCESSED' },
        path: '/v1/subscriptions/1/events/random',
      });

      fakeAPI({
        baseUrl: fakeAlgoanBaseUrl,
        method: 'post',
        result: {
          access_token: 'token',
          refresh_token: 'refresh_token',
          expires_in: 3000,
          refresh_expires_in: 10000,
        },
        path: '/v2/oauth/token',
      });

      fakeAPI({
        baseUrl: fakeAlgoanBaseUrl,
        method: 'get',
        result: {
          id: 'customerId',
          customIdentifier: 'client_unique_identifier',
          aggregationDetails: {
            callbackUrl: `${fakeAlgoanBaseUrl}/callback`,
            mode: AggregationDetailsMode.iframe,
          },
        },
        path: '/v2/customers/customerId',
      });

      fakeAPI({
        baseUrl: fakeAlgoanBaseUrl,
        method: 'patch',
        result: {
          id: 'customerId',
          customIdentifier: 'client_unique_identifier',
          aggregationDetails: {
            callbackUrl: `${fakeAlgoanBaseUrl}/callback`,
            userId: 'new-user-id',
            iframeUrl: 'https://sandbox-embed.oxlin.io/widget/add_connection?session_id=xxxxxxxx',
            mode: AggregationDetailsMode.iframe,
            aggregatorName: AggregationDetailsAggregatorName.linxoConnect,
          },
        },
        path: '/v2/customers/customerId',
      });

      fakeAPI({
        baseUrl: config.linxoConnect.sandbox.authBaseUrl,
        method: 'post',
        result: {
          access_token: 'new-token',
        },
        path: '/token',
        nbOfCalls: 2,
      });

      fakeAPI({
        baseUrl: config.linxoConnect.sandbox.apiBaseUrl,
        method: 'post',
        result: {},
        responseHeaders: {
          location: '/users/xxxxxx',
        },
        path: '/users',
      });

      fakeAPI({
        baseUrl: config.linxoConnect.sandbox.embedBaseUrl,
        method: 'post',
        result: {
          session_id: 'xxxxxxx',
          _links: {
            add_connection: 'https://sandbox-embed.oxlin.io/widget/add_connection?session_id=xxxxxxx',
            professional_account: 'https://sandbox-embed.oxlin.io/widget/professional-account?session_id=xxxxxxx',
            terms: 'https://sandbox-embed.oxlin.io/widget/terms?session_id=xxxxxxx',
          },
        },
        path: '/widget/widget_session',
      });

      await request(app.getHttpServer())
        .post('/hooks')
        .send({
          subscription: {
            id: '1',
            target: 'http://',
            status: 'ACTIVE',
            eventName: 'aggregator_link_required',
          },
          id: 'random',
          index: 1,
          time: Date.now(),
          payload: {
            customerId: 'customerId',
          },
        })
        .expect(HttpStatus.NO_CONTENT);
    });

    it('HK005 - should be failed - event not handled', async () => {
      fakeAPI({
        baseUrl: fakeAlgoanBaseUrl,
        method: 'patch',
        result: { status: 'FAILED' },
        path: '/v1/subscriptions/1/events/random',
      });

      await request(app.getHttpServer())
        .post('/hooks')
        .send({
          subscription: {
            id: '1',
            target: 'http://',
            status: 'ACTIVE',
            eventName: 'service_account_deleted',
          },
          id: 'random',
          index: 1,
          time: Date.now(),
          payload: {
            banksUserId: 'banks_user_id',
            applicationId: 'app_id',
          },
        })
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
