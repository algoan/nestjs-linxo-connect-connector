import { Inject, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Config } from 'node-config-ts';

import { CONFIG } from '../../config/config.module';

import { CreateUserInput } from '../dto/create-user.input';
import { OxlinUser } from '../dto/user.object';
import { CustomHttpService } from '../../shared/services/http.service';

/**
 * Service to manage user
 */
@Injectable()
export class OxlinUserService {
  constructor(@Inject(CONFIG) private readonly config: Config, private readonly customHttpService: CustomHttpService) {}

  /**
   * Create a new user
   */
  public async getUser(userAccessToken: string, userId: string): Promise<OxlinUser> {
    const response: AxiosResponse<OxlinUser> = await this.customHttpService.get<OxlinUser>(
      this.config.oxlin.apiBaseUrl,
      `/users/${userId}`,
      undefined,
      userAccessToken,
    );

    return response.data;
  }

  /**
   * Create a new user
   */
  public async createNewUser(clientAccessToken: string, input: CreateUserInput): Promise<string> {
    const response: AxiosResponse<undefined> = await this.customHttpService.post<undefined, CreateUserInput>(
      this.config.oxlin.apiBaseUrl,
      '/users',
      input,
      clientAccessToken,
    );

    const lastItem: number = -1;
    const userId: string | undefined = response.headers.location?.split('/').slice(lastItem).pop();

    if (userId === undefined) {
      throw new Error('Error while creating user');
    }

    return userId;
  }
}
