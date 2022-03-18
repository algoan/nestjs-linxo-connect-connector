import * as nock from 'nock';
import { HttpStatus } from '@nestjs/common';

/**
 * FakeApiOptions
 */
interface FakeApiOptions {
  baseUrl: string;
  method: 'get' | 'post' | 'patch';
  result: object | string | undefined;
  responseHeaders?: Record<string, string>;
  path: string;
  nbOfCalls?: number;
}

/**
 * Return a nock scope instance
 */
export const fakeAPI = (params: FakeApiOptions): nock.Scope =>
  nock(params.baseUrl, {})
    [params.method](params.path)
    .times(params.nbOfCalls ?? 1)
    .reply(HttpStatus.OK, params.result, params.responseHeaders);
