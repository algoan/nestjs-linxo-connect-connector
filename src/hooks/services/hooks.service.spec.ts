/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/naming-convention,camelcase */
import {
  Algoan,
  IServiceAccount,
  ISubscriptionEvent,
  RequestBuilder,
  ServiceAccount,
  Subscription,
  SubscriptionEvent,
} from '@algoan/rest';
import { Test, TestingModule } from '@nestjs/testing';
import { config } from 'node-config-ts';
import { ContextIdFactory } from '@nestjs/core';
import { createMock } from '@golevelup/ts-jest';

import { LinxoConnectConnectionStatus } from '../../linxo-connect/dto/connection.enums';
import { linxoConnectUserMock } from '../../linxo-connect/dto/user.object.mock';
import { linxoConnectConnectionMock } from '../../linxo-connect/dto/connection.object.mock';
import { linxoConnectAccountsMock } from '../../linxo-connect/dto/account.object.mock';
import { linxoConnectTransactionsMock } from '../../linxo-connect/dto/transaction.object.mock';
import { AnalysisFormat, AnalysisStatus, ErrorCodes } from '../../algoan/dto/analysis.enum';
import { analysisMock } from '../../algoan/dto/analysis.objects.mock';
import { LinxoConnectAccountService } from '../../linxo-connect/services/linxo-account.service';
import { LinxoConnectConnectionService } from '../../linxo-connect/services/linxo-connection.service';
import { AlgoanAnalysisService } from '../../algoan/services/algoan-analysis.service';
import { LinxoConnectAuthService } from '../../linxo-connect/services/linxo-auth.service';
import { LinxoConnectModule } from '../../linxo-connect/linxo.module';
import { LinxoConnectLinkService } from '../../linxo-connect/services/linxo-link.service';
import { LinxoConnectUserService } from '../../linxo-connect/services/linxo-user.service';
import { serviceAccountConfigMock } from '../../algoan/dto/service-account.objects.mock';
import { AlgoanModule } from '../../algoan/algoan.module';
import { customerMock } from '../../algoan/dto/customer.objects.mock';
import { AlgoanCustomerService } from '../../algoan/services/algoan-customer.service';
import { AlgoanHttpService } from '../../algoan/services/algoan-http.service';
import { CONFIG } from '../../config/config.module';
import { AlgoanService } from '../../algoan/services/algoan.service';
import { AggregationDetailsAggregatorName, AggregationDetailsMode } from '../../algoan/dto/customer.enums';

import { aggregatorLinkRequiredMock } from '../dto/aggregator-link-required-payload.dto.mock';
import { subscriptionMock } from '../dto/subscription.dto.mock';

import { bankDetailsRequiredMock } from '../dto/bank-details-required-payload.dto.mock';
import { mapLinxoConnectDataToAlgoanAnalysis } from '../mappers/analysis.mapper';
import { HooksService } from './hooks.service';

describe('HookService', () => {
  let hookService: HooksService;
  let algoanService: AlgoanService;
  let algoanHttpService: AlgoanHttpService;
  let algoanCustomerService: AlgoanCustomerService;
  let algoanAnalysisService: AlgoanAnalysisService;
  let linxoConnectLinkService: LinxoConnectLinkService;
  let linxoConnectUserService: LinxoConnectUserService;
  let linxoConnectAuthService: LinxoConnectAuthService;
  let linxoConnectConnectionService: LinxoConnectConnectionService;
  let linxoConnectAccountService: LinxoConnectAccountService;
  let serviceAccount: ServiceAccount;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const serviceAccountValue: ServiceAccount = new ServiceAccount('mockBaseURL', {
      id: 'mockServiceAccountId',
      clientId: 'mockClientId',
      clientSecret: 'mockClientSecret',
      createdAt: 'mockCreatedAt',
      config: serviceAccountConfigMock,
    } as IServiceAccount);

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AlgoanModule, LinxoConnectModule],
      providers: [
        HooksService,
        {
          provide: CONFIG,
          useValue: config,
        },
        {
          provide: ServiceAccount,
          useValue: serviceAccountValue,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    hookService = await moduleRef.resolve<HooksService>(HooksService, contextId);
    algoanService = await moduleRef.resolve<AlgoanService>(AlgoanService, contextId);
    algoanHttpService = await moduleRef.resolve<AlgoanHttpService>(AlgoanHttpService, contextId);
    algoanCustomerService = await moduleRef.resolve<AlgoanCustomerService>(AlgoanCustomerService, contextId);
    algoanAnalysisService = await moduleRef.resolve<AlgoanAnalysisService>(AlgoanAnalysisService, contextId);
    linxoConnectAuthService = await moduleRef.resolve<LinxoConnectAuthService>(LinxoConnectAuthService, contextId);
    linxoConnectUserService = await moduleRef.resolve<LinxoConnectUserService>(LinxoConnectUserService, contextId);
    linxoConnectLinkService = await moduleRef.resolve<LinxoConnectLinkService>(LinxoConnectLinkService, contextId);
    linxoConnectConnectionService = await moduleRef.resolve<LinxoConnectConnectionService>(
      LinxoConnectConnectionService,
      contextId,
    );
    linxoConnectAccountService = await moduleRef.resolve<LinxoConnectAccountService>(
      LinxoConnectAccountService,
      contextId,
    );
    serviceAccount = await moduleRef.resolve<ServiceAccount>(ServiceAccount, contextId);

    jest.spyOn(Algoan.prototype, 'initRestHooks').mockResolvedValue();

    await algoanService.onModuleInit();

    jest
      .spyOn(SubscriptionEvent.prototype, 'update')
      .mockResolvedValue({} as unknown as ISubscriptionEvent & { id: string });
    jest.spyOn(algoanService.algoanClient, 'getServiceAccountBySubscriptionId').mockReturnValue(serviceAccount);

    serviceAccount.subscriptions = [
      new Subscription(subscriptionMock, new RequestBuilder('mockBaseURL', { clientId: 'mockClientId' })),
    ];
  });

  it('should be defined', () => {
    expect(hookService).toBeDefined();
  });

  describe('handleAggregatorLinkRequiredEvent', () => {
    let algoanAuthenticateSpy: jest.SpyInstance;
    let geClientTokenSpy: jest.SpyInstance;
    let getUserTokenSpy: jest.SpyInstance;
    let updateCustomerSpy: jest.SpyInstance;
    let getIframeUrlSpy: jest.SpyInstance;
    let getCustomerByIdSpy: jest.SpyInstance;
    let getUserSpy: jest.SpyInstance;
    let createNewUserSpy: jest.SpyInstance;

    beforeEach(async () => {
      algoanAuthenticateSpy = jest.spyOn(algoanHttpService, 'authenticate').mockReturnValue();
      updateCustomerSpy = jest.spyOn(algoanCustomerService, 'updateCustomer').mockResolvedValue(customerMock);
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue(customerMock);
      geClientTokenSpy = jest
        .spyOn(linxoConnectAuthService, 'geClientToken')
        .mockResolvedValue(`client-token-${process.pid}`);
      getUserTokenSpy = jest
        .spyOn(linxoConnectAuthService, 'getUserToken')
        .mockResolvedValue(`user-token-${process.pid}`);
      getUserSpy = jest.spyOn(linxoConnectUserService, 'getUser').mockResolvedValue(linxoConnectUserMock);
      createNewUserSpy = jest.spyOn(linxoConnectUserService, 'createNewUser').mockResolvedValue(`id-${process.pid}`);
      getIframeUrlSpy = jest.spyOn(linxoConnectLinkService, 'getIframeUrl').mockResolvedValue('MY_LINK_URL');
    });

    it('should throw error if customer callback url missing', async () => {
      // We return a customer without callback url
      updateCustomerSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          callbackUrl: undefined,
        },
      });

      await expect(hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock)).rejects.toThrowError(
        `Missing information: callbackUrl: undefined, clientConfig: ${JSON.stringify(serviceAccountConfigMock)}`,
      );
    });

    it('should throw error if client config missing', async () => {
      serviceAccount.config = undefined;
      await expect(hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock)).rejects.toThrowError(
        `Missing information: callbackUrl: ${customerMock.aggregationDetails.callbackUrl}, clientConfig: undefined`,
      );
    });

    it('should do these steps WITHOUT an existing linxo connectuser', async () => {
      await hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock);

      // get algoan customer
      expect(algoanAuthenticateSpy).toHaveBeenCalled();
      expect(getCustomerByIdSpy).toHaveBeenCalledWith(aggregatorLinkRequiredMock.customerId);

      // Should not to get the existing user
      expect(getUserSpy).not.toHaveBeenCalled();

      // get a linxo connectclient token
      expect(geClientTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
      );
      // and create a new user
      expect(createNewUserSpy).toHaveBeenCalledWith(`client-token-${process.pid}`, {
        email: algoanCustomerService.getDefaultEmail(customerMock.id),
        password: algoanCustomerService.getDefaultPassword(customerMock.id),
      });

      // then get a user token
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );

      // to get a new iframe url
      expect(getIframeUrlSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        serviceAccountConfigMock.connectionUrl,
        customerMock.aggregationDetails.callbackUrl,
      );

      // and finally save userId and url in customer details
      expect(updateCustomerSpy).toHaveBeenCalledWith(aggregatorLinkRequiredMock.customerId, {
        aggregationDetails: {
          iframeUrl: 'MY_LINK_URL',
          userId: `id-${process.pid}`,
          mode: AggregationDetailsMode.iframe,
          aggregatorName: AggregationDetailsAggregatorName.linxoConnect,
        },
      });
    });

    it('should do these steps WITH an existing linxo connectuser', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `id-${process.pid}`,
        },
      });

      await hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock);

      // Should try to get the existing user
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );
      expect(getUserSpy).toHaveBeenCalledWith(`user-token-${process.pid}`, `id-${process.pid}`);

      // DO NOT get a linxo connectclient token
      expect(geClientTokenSpy).not.toHaveBeenCalled();
      // and DO NOT create a new user
      expect(createNewUserSpy).not.toHaveBeenCalled();

      // then get a user token
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );

      // to get a new iframe url
      expect(getIframeUrlSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        serviceAccountConfigMock.connectionUrl,
        customerMock.aggregationDetails.callbackUrl,
      );

      // and finally save userid and url in customer details
      expect(updateCustomerSpy).toHaveBeenCalledWith(aggregatorLinkRequiredMock.customerId, {
        aggregationDetails: {
          iframeUrl: 'MY_LINK_URL',
          userId: `id-${process.pid}`,
          mode: AggregationDetailsMode.iframe,
          aggregatorName: AggregationDetailsAggregatorName.linxoConnect,
        },
      });
    });

    it('should do these steps WITH an existing linxo connectuser AND there is an error while retrieving it', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `id-${process.pid}`,
        },
      });

      // Throw an error while conecting as the existing user
      getUserTokenSpy = jest.spyOn(linxoConnectAuthService, 'getUserToken').mockRejectedValueOnce(new Error());

      await hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock);

      // Should try to get a token for the existing user
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );
      expect(getUserSpy).not.toHaveBeenCalled();

      // BUT there is an error

      // SO Connect to linxo connectas client
      expect(geClientTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
      );
      // and create a new user !!!
      expect(createNewUserSpy).toHaveBeenCalledWith(`client-token-${process.pid}`, {
        email: algoanCustomerService.getDefaultEmail(customerMock.id),
        password: algoanCustomerService.getDefaultPassword(customerMock.id),
      });

      // then get a user token
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );

      // to get a new iframe url
      expect(getIframeUrlSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        serviceAccountConfigMock.connectionUrl,
        customerMock.aggregationDetails.callbackUrl,
      );

      // and finally save userid and url in customer details
      expect(updateCustomerSpy).toHaveBeenCalledWith(aggregatorLinkRequiredMock.customerId, {
        aggregationDetails: {
          iframeUrl: 'MY_LINK_URL',
          userId: `id-${process.pid}`,
          mode: AggregationDetailsMode.iframe,
          aggregatorName: AggregationDetailsAggregatorName.linxoConnect,
        },
      });
    });
  });

  describe('handleBankDetailsRequiredEvent', () => {
    let algoanAuthenticateSpy: jest.SpyInstance;
    let getUserTokenSpy: jest.SpyInstance;
    let deleteUserTokenSpy: jest.SpyInstance;
    let getCustomerByIdSpy: jest.SpyInstance;
    let getConnectionByIdSpy: jest.SpyInstance;
    let getAllAccountsForConnectionSpy: jest.SpyInstance;
    let getAllTransactionsForAllAccountsSpy: jest.SpyInstance;
    let updateAnalysisSpy: jest.SpyInstance;
    let getUserSpy: jest.SpyInstance;

    beforeEach(async () => {
      algoanAuthenticateSpy = jest.spyOn(algoanHttpService, 'authenticate').mockReturnValue();
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue(customerMock);
      updateAnalysisSpy = jest.spyOn(algoanAnalysisService, 'updateAnalysis').mockResolvedValue(analysisMock);
      getUserTokenSpy = jest
        .spyOn(linxoConnectAuthService, 'getUserToken')
        .mockResolvedValue(`user-token-${process.pid}`);
      getUserSpy = jest.spyOn(linxoConnectUserService, 'getUser').mockResolvedValue(linxoConnectUserMock);
      deleteUserTokenSpy = jest.spyOn(linxoConnectUserService, 'deleteUser').mockResolvedValue();
      getConnectionByIdSpy = jest
        .spyOn(linxoConnectConnectionService, 'getConnectionWithFinalStatus')
        .mockResolvedValue(linxoConnectConnectionMock);
      getAllAccountsForConnectionSpy = jest
        .spyOn(linxoConnectAccountService, 'getAllAccountsForConnection')
        .mockResolvedValue(linxoConnectAccountsMock);
      getAllTransactionsForAllAccountsSpy = jest
        .spyOn(linxoConnectAccountService, 'getAllTransactionsForAllAccounts')
        .mockResolvedValue(linxoConnectTransactionsMock);
    });

    it('should throw error if client config missing', async () => {
      serviceAccount.config = undefined;
      await expect(
        hookService.handleBankDetailsRequiredEvent(bankDetailsRequiredMock, new Date()),
      ).rejects.toThrowError(`Missing information: clientConfig: undefined`);

      expect(updateAnalysisSpy).toHaveBeenCalledWith(
        bankDetailsRequiredMock.customerId,
        bankDetailsRequiredMock.analysisId,
        {
          format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
          status: AnalysisStatus.ERROR,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: `An error occured when fetching data from the aggregator`,
          },
          connections: [],
        },
      );
    });

    it('should do these steps WITHOUT an existing linxo connectuser', async () => {
      await expect(
        hookService.handleBankDetailsRequiredEvent(bankDetailsRequiredMock, new Date()),
      ).rejects.toThrowError("LinxoConnect user id is not defined, can't connect to LinxoConnect");

      expect(updateAnalysisSpy).toHaveBeenCalledWith(
        bankDetailsRequiredMock.customerId,
        bankDetailsRequiredMock.analysisId,
        {
          format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
          status: AnalysisStatus.ERROR,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: `An error occured when fetching data from the aggregator`,
          },
          connections: [],
        },
      );
    });

    it('should do these steps WITH an existing linxo connectuser and WITH WRONG connection status', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `userId-${process.pid}`,
        },
      });

      getConnectionByIdSpy.mockResolvedValue({
        ...linxoConnectConnectionMock,
        status: LinxoConnectConnectionStatus.FAILED,
      });

      await hookService.handleBankDetailsRequiredEvent(bankDetailsRequiredMock, new Date());

      // Start to get LinxoConnect data
      // first get connection
      expect(getConnectionByIdSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        linxoConnectUserMock.id,
        bankDetailsRequiredMock.temporaryCode,
        serviceAccountConfigMock.finalConnectionTimeoutInMS,
      );

      expect(updateAnalysisSpy).toHaveBeenCalledWith(
        bankDetailsRequiredMock.customerId,
        bankDetailsRequiredMock.analysisId,
        {
          format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
          status: AnalysisStatus.ERROR,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: `Fail to get connection with a valid status. Received ${LinxoConnectConnectionStatus.FAILED}`,
          },
          connections: [{ ...linxoConnectConnectionMock, status: LinxoConnectConnectionStatus.FAILED, accounts: [] }],
        },
      );

      // but not accounts
      expect(getAllAccountsForConnectionSpy).not.toHaveBeenCalled();

      // neither transactions
      expect(getAllTransactionsForAllAccountsSpy).not.toHaveBeenCalled();

      // And finally we DIDN'T delete the user
      expect(deleteUserTokenSpy).not.toHaveBeenCalled();
    });

    it('should do these steps if LinxoConnect return an error', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `userId-${process.pid}`,
        },
      });

      getAllTransactionsForAllAccountsSpy.mockRejectedValue(new Error('bla bla'));

      await expect(
        hookService.handleBankDetailsRequiredEvent(bankDetailsRequiredMock, new Date()),
      ).rejects.toThrowError('bla bla');

      expect(updateAnalysisSpy).toHaveBeenCalledWith(
        bankDetailsRequiredMock.customerId,
        bankDetailsRequiredMock.analysisId,
        {
          format: AnalysisFormat.OXLIN_ACCOUNT_API_V2,
          status: AnalysisStatus.ERROR,
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: `An error occured when fetching data from the aggregator`,
          },
          connections: [],
        },
      );

      // And finally we DIDN'T delete the user
      expect(deleteUserTokenSpy).not.toHaveBeenCalled();
    });

    it('should do these steps WITH an existing linxo connectuser and WITHOUT LinxoConnect error', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `userId-${process.pid}`,
        },
      });

      await hookService.handleBankDetailsRequiredEvent(bankDetailsRequiredMock, new Date());

      // Should try to get the existing user
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );
      expect(getUserSpy).toHaveBeenCalledWith(`user-token-${process.pid}`, `userId-${process.pid}`);

      // then get a user token
      expect(getUserTokenSpy).toHaveBeenCalledWith(
        serviceAccountConfigMock.clientId,
        serviceAccountConfigMock.clientSecret,
        algoanCustomerService.getDefaultEmail(customerMock.id),
        algoanCustomerService.getDefaultPassword(customerMock.id),
      );

      // Start to get LinxoConnect data
      // first get connection
      expect(getConnectionByIdSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        linxoConnectUserMock.id,
        bankDetailsRequiredMock.temporaryCode,
        serviceAccountConfigMock.finalConnectionTimeoutInMS,
      );

      // then accounts
      expect(getAllAccountsForConnectionSpy).toHaveBeenCalledWith(
        `user-token-${process.pid}`,
        linxoConnectConnectionMock.id,
      );

      // and then transactions for all accounts
      expect(getAllTransactionsForAllAccountsSpy).toHaveBeenCalledWith(`user-token-${process.pid}`, [
        linxoConnectAccountsMock[0].id,
        linxoConnectAccountsMock[1].id,
      ]);

      // We can now update the analysis with linxo connect data
      expect(updateAnalysisSpy).toHaveBeenCalledWith(
        bankDetailsRequiredMock.customerId,
        bankDetailsRequiredMock.analysisId,
        mapLinxoConnectDataToAlgoanAnalysis(
          linxoConnectConnectionMock,
          linxoConnectAccountsMock,
          linxoConnectTransactionsMock,
        ),
      );

      // And finally we can delete the user
      expect(deleteUserTokenSpy).toHaveBeenCalledWith(`user-token-${process.pid}`, linxoConnectUserMock.id);
    });
  });
});
