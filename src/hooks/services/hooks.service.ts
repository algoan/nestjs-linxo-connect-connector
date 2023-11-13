/* eslint-disable @typescript-eslint/naming-convention, camelcase */
import { ServiceAccount } from '@algoan/rest';
import { Injectable, Logger } from '@nestjs/common';

import { AlgoanAnalysisService } from '../../algoan/services/algoan-analysis.service';
import { LinxoConnectConnection } from '../../linxo-connect/dto/connection.object';
import { LinxoConnectConnectionService } from '../../linxo-connect/services/linxo-connection.service';
import { LinxoConnectConnectionStatus } from '../../linxo-connect/dto/connection.enums';
import { LinxoConnectAccount } from '../../linxo-connect/dto/account.object';
import { LinxoConnectAccountService } from '../../linxo-connect/services/linxo-account.service';
import { LinxoConnectTransaction } from '../../linxo-connect/dto/transaction.object';
import { AggregationDetailsAggregatorName, AggregationDetailsMode } from '../../algoan/dto/customer.enums';
import { LinxoConnectAuthService } from '../../linxo-connect/services/linxo-auth.service';
import { LinxoConnectUserService } from '../../linxo-connect/services/linxo-user.service';
import { LinxoConnectLinkService } from '../../linxo-connect/services/linxo-link.service';
import { assertsTypeValidation } from '../../shared/utils/common.utils';
import { Customer } from '../../algoan/dto/customer.objects';
import { AlgoanCustomerService } from '../../algoan/services/algoan-customer.service';
import { ClientConfig } from '../../algoan/dto/service-account.objects';
import { AlgoanHttpService } from '../../algoan/services/algoan-http.service';

import { AggregatorLinkRequiredDTO } from '../dto/aggregator-link-required-payload.dto';
import { BankDetailsRequiredDTO } from '../dto/bank-details-required-payload.dto';
import { mapLinxoConnectDataToAlgoanAnalysis, mapLinxoConnectErrorToAlgoanAnalysis } from '../mappers/analysis.mapper';
import { WidgetConfig } from '../../algoan/dto/widget-config.objects';
import { Env } from '../../linxo-connect/dto/env.enums';

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
    private readonly algoanHttpService: AlgoanHttpService,
    private readonly algoanCustomerService: AlgoanCustomerService,
    private readonly algoanAnalysisService: AlgoanAnalysisService,
    private readonly serviceAccount: ServiceAccount,
    private readonly linxoConnectAuthService: LinxoConnectAuthService,
    private readonly linxoConnectUserService: LinxoConnectUserService,
    private readonly linxoConnectLinkService: LinxoConnectLinkService,
    private readonly linxoConnectConnectionService: LinxoConnectConnectionService,
    private readonly linxoConnectAccountService: LinxoConnectAccountService,
  ) {}

  /**
   * Handle Aggregator Link event
   */
  public async handleAggregatorLinkRequiredEvent(payload: AggregatorLinkRequiredDTO): Promise<void> {
    // Authenticate to algoan
    this.algoanHttpService.authenticate(this.serviceAccount.clientId, this.serviceAccount.clientSecret);

    // Get user information and client config
    const customer: Customer = await this.algoanCustomerService.getCustomerById(payload.customerId);

    // Ignore query params since LinxoConnect does not accept variables
    const callbackUrl: string | undefined = customer.aggregationDetails.callbackUrl?.split(/[?#]/)[0];
    const clientConfig: ClientConfig | undefined = this.serviceAccount.config as ClientConfig | undefined;
    const env: Env = clientConfig?.env ?? Env.sandbox;

    // Validate config
    if (callbackUrl === undefined || clientConfig === undefined) {
      throw new Error(
        `Missing information: callbackUrl: ${callbackUrl}, clientConfig: ${JSON.stringify(clientConfig)}`,
      );
    }
    assertsTypeValidation(ClientConfig, clientConfig);
    if (clientConfig.widgetConfig !== undefined) {
      assertsTypeValidation(WidgetConfig, clientConfig.widgetConfig);
    }

    // Get the linxoConnect user if saved on customer
    let linxoConnectUserId: string | undefined = customer.aggregationDetails.userId;
    let userAccessToken: string | undefined;
    if (linxoConnectUserId !== undefined) {
      try {
        // Get user token
        userAccessToken = await this.linxoConnectAuthService.getUserToken(
          clientConfig.clientId,
          clientConfig.clientSecret,
          this.algoanCustomerService.getDefaultEmail(customer.id),
          this.algoanCustomerService.getDefaultPassword(customer.id),
          env,
        );
        await this.linxoConnectUserService.getUser(userAccessToken, linxoConnectUserId, env);
      } catch (e) {
        // the user doesn't exist anymore
        userAccessToken = undefined;
        linxoConnectUserId = undefined;
      }
    }

    // else create a new user
    if (linxoConnectUserId === undefined || userAccessToken === undefined) {
      // Get client access token
      const clientAccessToken: string = await this.linxoConnectAuthService.geClientToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
        env,
      );

      linxoConnectUserId = await this.linxoConnectUserService.createNewUser(
        clientAccessToken,
        {
          email: this.algoanCustomerService.getDefaultEmail(customer.id),
          password: this.algoanCustomerService.getDefaultPassword(customer.id),
        },
        env,
      );

      // Get user token
      userAccessToken = await this.linxoConnectAuthService.getUserToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
        this.algoanCustomerService.getDefaultEmail(customer.id),
        this.algoanCustomerService.getDefaultPassword(customer.id),
        env,
      );
    }

    // Get iFrame Url
    const iframeUrl: string = await this.linxoConnectLinkService.getIframeUrl(
      userAccessToken,
      clientConfig.clientId,
      clientConfig.clientSecret,
      clientConfig.connectionUrl,
      callbackUrl,
      env,
      customer.customIdentifier,
      clientConfig.widgetConfig,
    );

    // Update user with redirect link information and userId if provided
    await this.algoanCustomerService.updateCustomer(payload.customerId, {
      aggregationDetails: {
        iframeUrl,
        userId: linxoConnectUserId,
        mode: AggregationDetailsMode.iframe,
        aggregatorName: AggregationDetailsAggregatorName.linxoConnect,
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
      const env: Env = clientConfig?.env ?? Env.sandbox;

      // Validate config
      if (clientConfig === undefined) {
        throw new Error(`Missing information: clientConfig: undefined`);
      }
      assertsTypeValidation(ClientConfig, clientConfig);

      // Get the linxoConnect user saved on customer
      const linxoConnectUserId: string | undefined = customer.aggregationDetails.userId;
      if (linxoConnectUserId === undefined) {
        throw new Error("LinxoConnect user id is not defined, can't connect to LinxoConnect");
      }

      // Get the user access token
      const userAccessToken: string = await this.linxoConnectAuthService.getUserToken(
        clientConfig.clientId,
        clientConfig.clientSecret,
        this.algoanCustomerService.getDefaultEmail(customer.id),
        this.algoanCustomerService.getDefaultPassword(customer.id),
        env,
      );
      // test if the user exist
      await this.linxoConnectUserService.getUser(userAccessToken, linxoConnectUserId, env);

      // Get the connection with the final status
      const connection: LinxoConnectConnection = await this.linxoConnectConnectionService.getConnectionWithFinalStatus(
        userAccessToken,
        payload.temporaryCode,
        clientConfig.finalConnectionTimeoutInMS,
        env,
      );

      // Check if we NOT get a valid status
      if (connection.status !== LinxoConnectConnectionStatus.SUCCESS) {
        await this.algoanAnalysisService.updateAnalysis(
          payload.customerId,
          payload.analysisId,
          mapLinxoConnectErrorToAlgoanAnalysis(
            `Fail to get connection with a valid status. Received ${connection.status}`,
            connection,
          ),
        );

        return;
      }

      // Get All Accounts
      const accounts: LinxoConnectAccount[] = await this.linxoConnectAccountService.getAllAccountsForConnection(
        userAccessToken,
        connection.id,
        env,
      );

      // Get All transactions for all accounts
      const transactions: LinxoConnectTransaction[] =
        await this.linxoConnectAccountService.getAllTransactionsForAllAccounts(
          userAccessToken,
          accounts.map((account: LinxoConnectAccount) => account.id),
          env,
        );

      // Log duration
      const aggregationDuration: number = new Date().getTime() - aggregationStartDate.getTime();
      this.logger.log({
        message: `Account aggregation completed in ${aggregationDuration} milliseconds for Customer ${payload.customerId} and Analysis ${payload.analysisId}.`,
        aggregator: AggregationDetailsAggregatorName.linxoConnect,
        duration: aggregationDuration,
      });

      // Send the raw connection data to algoan with linxoConnect format
      await this.algoanAnalysisService.updateAnalysis(
        payload.customerId,
        payload.analysisId,
        mapLinxoConnectDataToAlgoanAnalysis(connection, accounts, transactions),
      );

      // And finally we can delete the user
      await this.linxoConnectUserService.deleteUser(userAccessToken, linxoConnectUserId, env);
    } catch (err) {
      // Update the analysis error
      await this.algoanAnalysisService.updateAnalysis(
        payload.customerId,
        payload.analysisId,
        mapLinxoConnectErrorToAlgoanAnalysis(`An error occured when fetching data from the aggregator`),
      );

      throw err;
    }
  }
}
