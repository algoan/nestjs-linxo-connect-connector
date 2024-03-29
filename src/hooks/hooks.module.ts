import { Module } from '@nestjs/common';

import { LinxoConnectModule } from '../linxo-connect/linxo.module';
import { ConfigModule } from '../config/config.module';
import { AlgoanModule } from '../algoan/algoan.module';

import { HooksController } from './controllers/hooks.controller';
import { HooksService } from './services/hooks.service';
import { serviceAccoutProviders } from './service-account.providers';

/**
 * Hooks module
 */
@Module({
  imports: [AlgoanModule, ConfigModule, LinxoConnectModule],
  controllers: [HooksController],
  providers: [...serviceAccoutProviders, HooksService],
})
export class HooksModule {}
