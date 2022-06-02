import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '../config/config.module';
import { LinxoConnectUserService } from './services/linxo-user.service';
import { LinxoConnectLinkService } from './services/linxo-link.service';
import { LinxoConnectAuthService } from './services/linxo-auth.service';
import { LinxoConnectAccountService } from './services/linxo-account.service';
import { LinxoConnectConnectionService } from './services/linxo-connection.service';

/**
 * LinxoConnect module
 */
@Module({
  imports: [ConfigModule, SharedModule],
  providers: [
    LinxoConnectAuthService,
    LinxoConnectUserService,
    LinxoConnectLinkService,
    LinxoConnectAccountService,
    LinxoConnectConnectionService,
  ],
  exports: [
    LinxoConnectAuthService,
    LinxoConnectUserService,
    LinxoConnectLinkService,
    LinxoConnectAccountService,
    LinxoConnectConnectionService,
  ],
})
export class LinxoConnectModule {}
