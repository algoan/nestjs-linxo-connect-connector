/* eslint-disable no-magic-numbers */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { ServiceAccount } from '@algoan/rest';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Config } from 'node-config-ts';

import { AggregationDetailsAggregatorName, AggregationDetailsMode } from '../../algoan/dto/customer.enums';
import { OxlinAuthService } from '../../oxlin/services/oxlin-auth.service';
import { OxlinUserService } from '../../oxlin/services/oxlin-user.service';
import { OxlinLinkService } from '../../oxlin/services/oxlin-link.service';
import { assertsTypeValidation } from '../../shared/utils/common.utils';
import { Customer } from '../../algoan/dto/customer.objects';
import { AlgoanCustomerService } from '../../algoan/services/algoan-customer.service';
import { ClientConfig } from '../../algoan/dto/service-account.objects';
import { CONFIG } from '../../config/config.module';
import { AlgoanHttpService } from '../../algoan/services/algoan-http.service';

import { AggregatorLinkRequiredDTO } from '../dto/aggregator-link-required-payload.dto';

/**
 * Hook service
 */
@Injectable()
export class HooksService {
  /**
   * Class logger
   */
  private readonly logger: Logger = new Logger(HooksService.name);

  constructor(
    @Inject(CONFIG) private readonly config: Config,
    private readonly algoanHttpService: AlgoanHttpService,
    private readonly algoanCustomerService: AlgoanCustomerService,
    private readonly serviceAccount: ServiceAccount,
    private readonly oxlinAuthService: OxlinAuthService,
    private readonly oxlinUserService: OxlinUserService,
    private readonly oxlinLinkService: OxlinLinkService,
  ) {}

  /**
   * Handle Aggregator Link event
   */
  public async handleAggregatorLinkRequiredEvent(payload: AggregatorLinkRequiredDTO): Promise<void> {
    // Authenticate to algoan
    this.algoanHttpService.authenticate(this.serviceAccount.clientId, this.serviceAccount.clientSecret);

    // Get user information and client config
    const customer: Customer = await this.algoanCustomerService.getCustomerById(payload.customerId);

    // Ignore query params since Oxlin does not accept variables
    const callbackUrl: string | undefined = customer.aggregationDetails.callbackUrl?.split(/[?#]/)[0];
    const clientConfig: ClientConfig | undefined = this.serviceAccount.config as ClientConfig | undefined;

    // Validate config
    if (callbackUrl === undefined || clientConfig === undefined) {
      throw new Error(
        `Missing information: callbackUrl: ${callbackUrl}, clientConfig: ${JSON.stringify(clientConfig)}`,
      );
    }
    assertsTypeValidation(ClientConfig, clientConfig);

    // Get the oxlin user if saved on customer
    let oxlinUserId: string | undefined = customer.aggregationDetails.userId;
    let userAccessToken: string | undefined;
    if (oxlinUserId !== undefined) {
      try {
        // Get user token
        userAccessToken = await this.oxlinAuthService.getUserToken(
          clientConfig.clientId,
          clientConfig.clientSecret,
          this.algoanCustomerService.getDefaultEmail(customer.id),
          this.algoanCustomerService.getDefaultPassword(customer.id),
        );
        await this.oxlinUserService.getUser(userAccessToken, oxlinUserId);
      } catch (e) {
        // the user doesn't exist anymore
        userAccessToken = undefined;
        oxlinUserId = undefined;
      }
    }

    // else create a new user
    if (oxlinUserId === undefined || userAccessToken === undefined) {
      // Get client access token
      const clientAccessToken: string = await this.oxlinAuthService.geClientToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
      );

      oxlinUserId = await this.oxlinUserService.createNewUser(clientAccessToken, {
        email: this.algoanCustomerService.getDefaultEmail(customer.id),
        password: this.algoanCustomerService.getDefaultPassword(customer.id),
      });

      // Get user token
      userAccessToken = await this.oxlinAuthService.getUserToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
        this.algoanCustomerService.getDefaultEmail(customer.id),
        this.algoanCustomerService.getDefaultPassword(customer.id),
      );
    }

    // Get iFrame Url
    const iframeUrl: string = await this.oxlinLinkService.getIframeUrl(
      userAccessToken,
      clientConfig.clientId,
      clientConfig.clientSecret,
      clientConfig.connectionUrl,
      callbackUrl,
    );

    // Update user with redirect link information and userId if provided
    await this.algoanCustomerService.updateCustomer(payload.customerId, {
      aggregationDetails: {
        iframeUrl,
        userId: oxlinUserId,
        mode: AggregationDetailsMode.iframe,
        aggregatorName: AggregationDetailsAggregatorName.oxlin,
      },
    });

    return;
  }
}
