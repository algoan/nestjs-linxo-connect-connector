import { Module } from '@nestjs/common';

import { ConfigModule } from '../config/config.module';

import { AlgoanCustomerService } from './services/algoan-customer.service';
import { AlgoanHttpService } from './services/algoan-http.service';
import { AlgoanService } from './services/algoan.service';

/**
 * Algoan module
 */
@Module({
  imports: [ConfigModule],
  providers: [AlgoanCustomerService, AlgoanHttpService, AlgoanService],
  exports: [AlgoanCustomerService, AlgoanHttpService, AlgoanService],
})
export class AlgoanModule {}
