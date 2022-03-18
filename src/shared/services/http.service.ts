/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import * as qs from 'qs';
import { Injectable, Scope } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

import { lastValueFrom } from 'rxjs';

/**
 * Service to request oxlin APIs
 */
@Injectable()
export class CustomHttpService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Do a GET query
   */
  public async get<ReturnType, ArgsType = unknown>(
    baseUrl: string,
    path: string,
    args?: ArgsType,
    token?: string,
  ): Promise<AxiosResponse<ReturnType>> {
    const response: AxiosResponse<ReturnType> = await lastValueFrom(
      this.httpService.get<ReturnType>(`${baseUrl}${path}${args !== undefined ? `?${qs.stringify(args)}` : ''}`, {
        headers: {
          ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    );

    return response;
  }

  /**
   * Do a POST query
   */
  public async post<ReturnType, InputType>(
    baseUrl: string,
    path: string,
    input: InputType,
    token?: string,
  ): Promise<AxiosResponse<ReturnType>> {
    const response: AxiosResponse<ReturnType> = await lastValueFrom(
      this.httpService.post<ReturnType>(`${baseUrl}${path}`, input, {
        headers: {
          ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    );

    return response;
  }

  /**
   * Do a PATCH request
   */
  public async patch<ReturnType, InputType>(
    baseUrl: string,
    path: string,
    input: InputType,
    token?: string,
  ): Promise<AxiosResponse<ReturnType>> {
    const response: AxiosResponse<ReturnType> = await lastValueFrom(
      this.httpService.patch<ReturnType>(`${baseUrl}${path}`, input, {
        headers: {
          ...(token !== undefined ? { Authorization: `Bearer ${token}` } : {}),
        },
      }),
    );

    return response;
  }
}
