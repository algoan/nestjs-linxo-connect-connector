/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';
import { AccessTokenInput } from '../dto/access-token.input';
import { AuthProviders, GrantType } from '../dto/grant-type.enum';
import { AccessTokenObject } from '../dto/access-token.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { Env } from '../dto/env.enums';

/**
 * Service to request linxo connect APIs
 */
@Injectable()
export class LinxoConnectAuthService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Get a client token
   */
  public async geClientToken(clientId: string, clientSecret: string, env: Env): Promise<string> {
    const input: AccessTokenInput = {
      provider: AuthProviders.LINXO_CONNECT,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: GrantType.CLIENT_CREDENTIALS,
      scope: 'users_create',
    };

    return this.getNewToken(input, env);
  }

  /**
   * Get a user token
   */
  public async getUserToken(
    clientId: string,
    clientSecret: string,
    email: string,
    password: string,
    env: Env,
  ): Promise<string> {
    const input: AccessTokenInput = {
      provider: AuthProviders.LINXO_CONNECT,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: GrantType.PASSWORD,
      scope: 'profile profile_edit accounts_manage connections_manage connections_sync transactions_read',

      username: email,
      password,
    };

    return this.getNewToken(input, env);
  }

  /**
   * Authenticate the service to linxo connect
   */
  private async getNewToken(input: AccessTokenInput, env: Env): Promise<string> {
    const authResponse: AxiosResponse<AccessTokenObject> = await this.customHttpService.post<
      AccessTokenObject,
      AccessTokenInput
    >(this.config.linxoConnect[env].authBaseUrl, `/token`, input);

    return authResponse.data.access_token;
  }
}
