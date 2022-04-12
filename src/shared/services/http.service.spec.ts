/* eslint-disable @typescript-eslint/naming-convention,camelcase */
import { createMock } from '@golevelup/ts-jest';
import * as qs from 'qs';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { config } from 'node-config-ts';
import { of } from 'rxjs';
import { ContextIdFactory } from '@nestjs/core';

import { CONFIG } from '../../config/config.module';

import { CustomHttpService } from './http.service';

describe(CustomHttpService.name, () => {
  let customHttpService: CustomHttpService;
  let httpService: HttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        CustomHttpService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    customHttpService = await moduleRef.resolve<CustomHttpService>(CustomHttpService, contextId);
    httpService = await moduleRef.resolve<HttpService>(HttpService, contextId);
  });

  it('should be defined', () => {
    expect(customHttpService).toBeDefined();
  });

  describe('get', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(httpService, 'get').mockReturnValue(of({ data: 'test' } as AxiosResponse<string>));
    });

    it('should send a get request with args WITH a token', async () => {
      const args = {
        param: `param-${process.pid}`,
      };

      // get result with args
      const result: AxiosResponse<string> = await customHttpService.get('https://base.url', '/my/path', args, 'token');

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path?${qs.stringify(args)}`, {
        headers: { Authorization: 'Bearer token' },
      });
      expect(result.data).toBe('test');
    });

    it('should send a get request with args WITHOUT a token', async () => {
      const args = {
        param: `param-${process.pid}`,
      };

      // get result with args
      const result: AxiosResponse<string> = await customHttpService.get('https://base.url', '/my/path', args);

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path?${qs.stringify(args)}`, {
        headers: {},
      });
      expect(result.data).toBe('test');
    });
  });

  describe('post', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(httpService, 'post').mockReturnValue(of({ data: 'test' } as AxiosResponse<string>));
    });

    it('should send a post request WITH a token', async () => {
      // post
      const input = { myField: 'myField' };
      const result: AxiosResponse<string> = await customHttpService.post(
        'https://base.url',
        '/my/path',
        input,
        'token',
      );

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path`, input, {
        headers: { Authorization: 'Bearer token' },
      });
      expect(result.data).toBe('test');
    });

    it('should send a post request WITHOUT a token', async () => {
      // post
      const input = { myField: 'myField' };
      const result: AxiosResponse<string> = await customHttpService.post('https://base.url', '/my/path', input);

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path`, input, {
        headers: {},
      });
      expect(result.data).toBe('test');
    });
  });

  describe('patch', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(httpService, 'patch').mockReturnValue(of({ data: 'test' } as AxiosResponse<string>));
    });

    it('should send a patch request WITH a token', async () => {
      // patch
      const input = { myField: 'myField' };
      const result: AxiosResponse<string> = await customHttpService.patch(
        'https://base.url',
        '/my/path',
        input,
        'token',
      );

      // mock patch
      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path`, input, {
        headers: { Authorization: 'Bearer token' },
      });
      expect(result.data).toBe('test');
    });

    it('should send a patch request WITHOUT a token', async () => {
      // patch
      const input = { myField: 'myField' };
      const result: AxiosResponse<string> = await customHttpService.patch('https://base.url', '/my/path', input);

      // mock patch
      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path`, input, {
        headers: {},
      });
      expect(result.data).toBe('test');
    });
  });

  describe('delete', () => {
    let spy: jest.SpyInstance;

    beforeEach(() => {
      spy = jest.spyOn(httpService, 'delete').mockReturnValue(of({ data: 'test' } as AxiosResponse<string>));
    });

    it('should send a delete request with args WITH a token', async () => {
      const args = {
        param: `param-${process.pid}`,
      };

      // delete result with args
      const result: AxiosResponse<string> = await customHttpService.delete(
        'https://base.url',
        '/my/path',
        args,
        'token',
      );

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path?${qs.stringify(args)}`, {
        headers: { Authorization: 'Bearer token' },
      });
      expect(result.data).toBe('test');
    });

    it('should send a delete request with args WITHOUT a token', async () => {
      const args = {
        param: `param-${process.pid}`,
      };

      // delete result with args
      const result: AxiosResponse<string> = await customHttpService.delete('https://base.url', '/my/path', args);

      expect(spy).toHaveBeenCalledWith(`https://base.url/my/path?${qs.stringify(args)}`, {
        headers: {},
      });
      expect(result.data).toBe('test');
    });
  });
});
