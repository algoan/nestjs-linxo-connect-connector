/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { ServiceAccount } from '@algoan/rest';
import { Injectable, Inject, Logger } from '@nestjs/common';
import { Config } from 'node-config-ts';

import { AlgoanAnalysisService } from '../../algoan/services/algoan-analysis.service';
import { OxlinConnection } from '../../oxlin/dto/connection.object';
import { OxlinConnectionService } from '../../oxlin/services/oxlin-connection.service';
import { OxlinConnectionStatus } from '../../oxlin/dto/connection.enums';
import { OxlinAccount } from '../../oxlin/dto/account.object';
import { OxlinAccountService } from '../../oxlin/services/oxlin-account.service';
import { OxlinTransaction } from '../../oxlin/dto/transaction.object';
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
import { BankDetailsRequiredDTO } from '../dto/bank-details-required-payload.dto';
import { mapOxlinDataToAlgoanAnalysis, mapOxlinErrorToAlgoanAnalysis } from '../mappers/analysis.mapper';

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
    private readonly algoanAnalysisService: AlgoanAnalysisService,
    private readonly serviceAccount: ServiceAccount,
    private readonly oxlinAuthService: OxlinAuthService,
    private readonly oxlinUserService: OxlinUserService,
    private readonly oxlinLinkService: OxlinLinkService,
    private readonly oxlinConnectionService: OxlinConnectionService,
    private readonly oxlinAccountService: OxlinAccountService,
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

  /**
   * Handle Aggregator Link event
   */
  public async handleBankDetailsRequiredEvent(
    payload: BankDetailsRequiredDTO,
    aggregationStartDate: Date,
  ): Promise<void> {
    try {
      // Authenticate to algoan
      this.algoanHttpService.authenticate(this.serviceAccount.clientId, this.serviceAccount.clientSecret);

      // Get user information and client config
      const customer: Customer = await this.algoanCustomerService.getCustomerById(payload.customerId);

      // Get client config
      const clientConfig: ClientConfig | undefined = this.serviceAccount.config as ClientConfig | undefined;

      // Validate config
      if (clientConfig === undefined) {
        throw new Error(`Missing information: clientConfig: undefined`);
      }
      assertsTypeValidation(ClientConfig, clientConfig);

      // Get the oxlin user saved on customer
      const oxlinUserId: string | undefined = customer.aggregationDetails.userId;
      if (oxlinUserId === undefined) {
        throw new Error("Oxlin user id is not defined, can't connect to Oxlin");
      }

      // Get the user access token
      const userAccessToken: string = await this.oxlinAuthService.getUserToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
        this.algoanCustomerService.getDefaultEmail(customer.id),
        this.algoanCustomerService.getDefaultPassword(customer.id),
      );
      // test if the user exist
      await this.oxlinUserService.getUser(userAccessToken, oxlinUserId);

      // Get the connection with the final status
      const connection: OxlinConnection = await this.oxlinConnectionService.getConnectionWithFinalStatus(
        userAccessToken,
        oxlinUserId,
        payload.temporaryCode,
        clientConfig.finalConnectionTimeoutInMS,
      );

      // Check if we NOT get a valid status
      if (connection.status !== OxlinConnectionStatus.SUCCESS) {
        await this.algoanAnalysisService.updateAnalysis(
          payload.customerId,
          payload.analysisId,
          mapOxlinErrorToAlgoanAnalysis(
            `Fail to get connection with a valid status. Received ${connection.status}`,
            connection,
          ),
        );

        return;
      }

      // Get All Accounts
      const accounts: OxlinAccount[] = await this.oxlinAccountService.getAllAccountsForConnection(
        userAccessToken,
        connection.id,
      );

      // Get All transactions for all accounts
      const transactions: OxlinTransaction[] = await this.oxlinAccountService.getAllTransactionsForAllAccounts(
        userAccessToken,
        accounts.map((account: OxlinAccount) => account.id),
      );

      // Log duration
      const aggregationDuration: number = new Date().getTime() - aggregationStartDate.getTime();
      this.logger.log({
        message: `Account aggregation completed in ${aggregationDuration} milliseconds for Customer ${payload.customerId} and Analysis ${payload.analysisId}.`,
        aggregator: AggregationDetailsAggregatorName.oxlin,
        duration: aggregationDuration,
      });

      // Send the raw connection data to algoan with oxlin format
      await this.algoanAnalysisService.updateAnalysis(
        payload.customerId,
        payload.analysisId,
        mapOxlinDataToAlgoanAnalysis(connection, accounts, transactions),
      );

      // And finally we can delete the user
      await this.oxlinUserService.deleteUser(userAccessToken, oxlinUserId);
    } catch (err) {
      // Update the analysis error
      await this.algoanAnalysisService.updateAnalysis(
        payload.customerId,
        payload.analysisId,
        mapOxlinErrorToAlgoanAnalysis(`An error occured when fetching data from the aggregator`),
      );

      throw err;
    }
  }
}
