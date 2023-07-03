import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';

import { CreateUserInput } from '../dto/create-user.input';
import { LinxoConnectUser } from '../dto/user.object';
import { CustomHttpService } from '../../shared/services/http.service';
import { Env } from '../dto/env.enums';

/**
 * Service to manage user
 */
@Injectable()
export class LinxoConnectUserService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Create a new user
   */
  public async getUser(userAccessToken: string, userId: string, env: Env): Promise<LinxoConnectUser> {
    const response: AxiosResponse<LinxoConnectUser> = await this.customHttpService.get<LinxoConnectUser>(
      // eslint-disable-next-line @typescript-eslint/tslint/config
      this.config.linxoConnect[env].apiBaseUrl,
      `/users/${userId}`,
      undefined,
      userAccessToken,
    );

    return response.data;
  }

  /**
   * Create a new user
   */
  public async createNewUser(clientAccessToken: string, input: CreateUserInput, env: Env): Promise<string> {
    const response: AxiosResponse<undefined> = await this.customHttpService.post<undefined, CreateUserInput>(
      // eslint-disable-next-line @typescript-eslint/tslint/config
      this.config.linxoConnect[env].apiBaseUrl,
      '/users',
      input,
      clientAccessToken,
    );

    const lastItem: number = -1;
    // eslint-disable-next-line @typescript-eslint/tslint/config
    const userId: string | undefined = response.headers.location?.split('/').slice(lastItem).pop();

    if (userId === undefined) {
      throw new Error('Error while creating user');
    }

    return userId;
  }

  /**
   * Delete the current user (Should be the same as the user token)
   */
  public async deleteUser(userAccessToken: string, userId: string, env: Env): Promise<void> {
    await this.customHttpService.delete<void>(
      // eslint-disable-next-line @typescript-eslint/tslint/config
      this.config.linxoConnect[env].apiBaseUrl,
      `/users/${userId}`,
      undefined,
      userAccessToken,
    );
  }
}
