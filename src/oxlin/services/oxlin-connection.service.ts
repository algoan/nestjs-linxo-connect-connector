/* eslint-disable no-magic-numbers */
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { delay } from '../../shared/utils/common.utils';
import { CONFIG } from '../../config/config.module';

import { OxlinConnection } from '../dto/connection.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { OxlinConnectionStatus } from '../dto/connection.enums';

const expFactor: number = 2;

/**
 * Service to manage connection
 */
@Injectable()
export class OxlinConnectionService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get the final connection: Status !== RUNNING
   */
  public async getConnectionWithFinalStatus(
    userAccessToken: string,
    userId: string,
    connectionId: string,
    timeoutInMS: number,
  ): Promise<OxlinConnection> {
    const startTimeInMS: number = Date.now();

    /**
     * Try To Get Final Connection in next interval
     */
    const tryToGetFinalConnection = async (nextIntervalInMS: number): Promise<OxlinConnection> => {
      const expectedDurationInMS: number = Date.now() - startTimeInMS + nextIntervalInMS;
      if (expectedDurationInMS > timeoutInMS) {
        throw new Error('Connection final status take too long');
      }

      const oxlinConnection: OxlinConnection = await this.getConnection(userAccessToken, userId, connectionId);

      if (oxlinConnection.status !== OxlinConnectionStatus.RUNNING) {
        return oxlinConnection;
      }

      await delay(nextIntervalInMS);

      return tryToGetFinalConnection(nextIntervalInMS * expFactor);
    };

    // Try the first interval
    return tryToGetFinalConnection(expFactor * 1_000);
  }

  /**
   * Get a connection
   *
   * @link https://developers.oxlin.io/reference-accounts-api/#operation/getConnectionByIdUsingGET
   */
  public async getConnection(userAccessToken: string, userId: string, connectionId: string): Promise<OxlinConnection> {
    const response: AxiosResponse<OxlinConnection> = await this.customHttpService.get<OxlinConnection>(
      this.config.oxlin.apiBaseUrl,
      `/connections/${connectionId}`,
      undefined,
      userAccessToken,
      {
        headers: {
          'x-linxo-user-id': userId,
          'x-scope': 'accounts_read transactions_read',
        },
      },
    );

    return response.data;
  }
}
