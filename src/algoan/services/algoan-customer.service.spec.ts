import { createMock } from '@golevelup/ts-jest';
import { ContextIdFactory } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { config } from 'node-config-ts';
import { CONFIG } from '../../config/config.module';
import { AggregationDetailsMode } from '../dto/customer.enums';
import { CustomerUpdateInput } from '../dto/customer.inputs';
import { Customer } from '../dto/customer.objects';

import { customerMock } from '../dto/customer.objects.mock';
import { AlgoanCustomerService } from './algoan-customer.service';

import { AlgoanHttpService } from './algoan-http.service';

describe(AlgoanCustomerService.name, () => {
  let algoanCustomerService: AlgoanCustomerService;
  let algoanHttpService: AlgoanHttpService;

  beforeEach(async () => {
    // To mock scoped DI
    const contextId = ContextIdFactory.create();
    jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AlgoanHttpService,
        AlgoanCustomerService,
        {
          provide: CONFIG,
          useValue: config,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    algoanCustomerService = await moduleRef.resolve<AlgoanCustomerService>(AlgoanCustomerService, contextId);
    algoanHttpService = await moduleRef.resolve<AlgoanHttpService>(AlgoanHttpService, contextId);
  });

  it('should be defined', () => {
    expect(algoanCustomerService).toBeDefined();
  });

  describe('getDefaultEmail', () => {
    it('should get default email', async () => {
      const email: string = algoanCustomerService.getDefaultEmail(customerMock.id);

      expect(email).toBe(`${customerMock.id}@algoan.com`);
    });
  });

  describe('getDefaultPassword', () => {
    it('should get default email', async () => {
      const password: string = algoanCustomerService.getDefaultPassword(customerMock.id);

      expect(password).toBe('eca108acaac73f650ceede55ac6f7e9a7e96b5abc24a737b8785a1218ea9c1c0');
    });
  });

  describe('getCustomerById', () => {
    it('should get a customer by id', async () => {
      const spy = jest.spyOn(algoanHttpService, 'get').mockReturnValue(Promise.resolve(customerMock));

      const customer: Customer = await algoanCustomerService.getCustomerById(customerMock.id);

      expect(spy).toHaveBeenCalledWith(`/v2/customers/${customerMock.id}`);
      expect(customer).toBe(customerMock);
    });
  });

  describe('updateCustomer', () => {
    it('should patch a customer', async () => {
      const spy = jest.spyOn(algoanHttpService, 'patch').mockReturnValue(Promise.resolve(customerMock));
      const input: CustomerUpdateInput = {
        aggregationDetails: {
          callbackUrl: 'string',
          token: 'string',
          redirectUrl: 'string',
          apiUrl: 'string',
          userId: 'string',
          clientId: 'string',
          mode: AggregationDetailsMode.iframe,
        },
      };
      const customer: Customer = await algoanCustomerService.updateCustomer(customerMock.id, input);

      expect(spy).toHaveBeenCalledWith(`/v2/customers/${customerMock.id}`, input);
      expect(customer).toBe(customerMock);
    });
  });
});
