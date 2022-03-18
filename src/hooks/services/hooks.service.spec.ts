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

import { OxlinAuthService } from '../../oxlin/services/oxlin-auth.service';
import { OxlinModule } from '../../oxlin/oxlin.module';
import { OxlinLinkService } from '../../oxlin/services/oxlin-link.service';
import { OxlinUserService } from '../../oxlin/services/oxlin-user.service';
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

import { HooksService } from './hooks.service';

describe('HookService', () => {
  let hookService: HooksService;
  let algoanService: AlgoanService;
  let algoanHttpService: AlgoanHttpService;
  let algoanCustomerService: AlgoanCustomerService;
  let oxlinLinkService: OxlinLinkService;
  let oxlinUserService: OxlinUserService;
  let oxlinAuthService: OxlinAuthService;
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
      imports: [AlgoanModule, OxlinModule],
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
    oxlinAuthService = await moduleRef.resolve<OxlinAuthService>(OxlinAuthService, contextId);
    oxlinUserService = await moduleRef.resolve<OxlinUserService>(OxlinUserService, contextId);
    oxlinLinkService = await moduleRef.resolve<OxlinLinkService>(OxlinLinkService, contextId);
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
      geClientTokenSpy = jest.spyOn(oxlinAuthService, 'geClientToken').mockResolvedValue(`client-token-${process.pid}`);
      getUserTokenSpy = jest.spyOn(oxlinAuthService, 'getUserToken').mockResolvedValue(`user-token-${process.pid}`);
      getUserSpy = jest
        .spyOn(oxlinUserService, 'getUser')
        .mockResolvedValue({ id: `id-${process.pid}`, email: 'email' });
      createNewUserSpy = jest.spyOn(oxlinUserService, 'createNewUser').mockResolvedValue(`id-${process.pid}`);
      getIframeUrlSpy = jest.spyOn(oxlinLinkService, 'getIframeUrl').mockResolvedValue('MY_LINK_URL');
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

    it('should do these steps WITHOUT an existing oxlin user', async () => {
      await hookService.handleAggregatorLinkRequiredEvent(aggregatorLinkRequiredMock);

      // get algoan customer
      expect(algoanAuthenticateSpy).toHaveBeenCalled();
      expect(getCustomerByIdSpy).toHaveBeenCalledWith(aggregatorLinkRequiredMock.customerId);

      // Should not to get the existing user
      expect(getUserSpy).not.toHaveBeenCalled();

      // get a oxlin client token
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
          aggregatorName: AggregationDetailsAggregatorName.oxlin,
        },
      });
    });

    it('should do these steps WITH an existing oxlin user', async () => {
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

      // DO NOT get a oxlin client token
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
          aggregatorName: AggregationDetailsAggregatorName.oxlin,
        },
      });
    });

    it('should do these steps WITH an existing oxlin user AND there is an error while retrieving it', async () => {
      // mock to return an existing userId
      getCustomerByIdSpy = jest.spyOn(algoanCustomerService, 'getCustomerById').mockResolvedValue({
        ...customerMock,
        aggregationDetails: {
          ...customerMock.aggregationDetails,
          userId: `id-${process.pid}`,
        },
      });

      // Throw an error while conecting as the existing user
      getUserTokenSpy = jest.spyOn(oxlinAuthService, 'getUserToken').mockRejectedValueOnce(new Error());

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

      // SO Connect to oxlin as client
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
          aggregatorName: AggregationDetailsAggregatorName.oxlin,
        },
      });
    });
  });
});
