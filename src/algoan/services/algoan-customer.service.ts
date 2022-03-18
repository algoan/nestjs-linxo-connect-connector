import { createHmac } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Config } from 'node-config-ts';
import { CONFIG } from '../../config/config.module';
import { CustomerUpdateInput } from '../dto/customer.inputs';
import { Customer } from '../dto/customer.objects';
import { AlgoanHttpService } from './algoan-http.service';

/**
 * Service to manage customers
 */
@Injectable()
export class AlgoanCustomerService {
  private readonly apiVersion: string = 'v2';

  constructor(@Inject(CONFIG) private readonly config: Config, private readonly algoanHttpService: AlgoanHttpService) {}

  /**
   * Get default customer email
   */
  public getDefaultEmail(id: string): string {
    return `${id}@algoan.com`;
  }

  /**
   * Get default customer email
   */
  public getDefaultPassword(id: string): string {
    const password: string = this.config.customerIdPassword;
    let hash: string = createHmac('sha256', password).update(id).digest('hex');
    const maxPasswordLength: number = 72;

    if (hash.length > maxPasswordLength) {
      hash = hash.slice(0, maxPasswordLength);
    }

    return hash;
  }

  /**
   * Get a customer with the given id
   */
  public async getCustomerById(id: string): Promise<Customer> {
    const path: string = `/${this.apiVersion}/customers/${id}`;

    return this.algoanHttpService.get<Customer>(path);
  }

  /**
   * Update a customer with the given id
   */
  public async updateCustomer(id: string, input: CustomerUpdateInput): Promise<Customer> {
    const path: string = `/${this.apiVersion}/customers/${id}`;

    return this.algoanHttpService.patch<Customer, CustomerUpdateInput>(path, input);
  }
}
