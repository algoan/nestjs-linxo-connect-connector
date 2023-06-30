/* eslint-disable no-magic-numbers */
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { delay } from '../../shared/utils/common.utils';
import { CONFIG } from '../../config/config.module';

import { LinxoConnectConnection } from '../dto/connection.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { LinxoConnectConnectionStatus } from '../dto/connection.enums';
import { Env } from '../dto/env.enums';

const expFactor: number = 2;

/**
 * Service to manage connection
 */
@Injectable()
export class LinxoConnectConnectionService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get the final connection: Status !== RUNNING
   */
  public async getConnectionWithFinalStatus(
    userAccessToken: string,
    connectionId: string,
    timeoutInMS: number,
    env: Env,
  ): Promise<LinxoConnectConnection> {
    const startTimeInMS: number = Date.now();

    /**
     * Try To Get Final Connection in next interval
     */
    const tryToGetFinalConnection = async (nextIntervalInMS: number): Promise<LinxoConnectConnection> => {
      const expectedDurationInMS: number = Date.now() - startTimeInMS + nextIntervalInMS;
      if (expectedDurationInMS > timeoutInMS) {
        throw new Error('Connection final status take too long');
      }

      const linxoConnectConnection: LinxoConnectConnection = await this.getConnection(
        userAccessToken,
        connectionId,
        env,
      );

      if (linxoConnectConnection.status !== LinxoConnectConnectionStatus.RUNNING) {
        return linxoConnectConnection;
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
  public async getConnection(userAccessToken: string, connectionId: string, env: Env): Promise<LinxoConnectConnection> {
    const response: AxiosResponse<LinxoConnectConnection> = await this.customHttpService.get<LinxoConnectConnection>(
      this.config.linxoConnect[env].apiBaseUrl,
      `/connections/${connectionId}`,
      undefined,
      userAccessToken,
    );

    return response.data;
  }
}
