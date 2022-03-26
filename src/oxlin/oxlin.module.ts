import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '../config/config.module';
import { OxlinUserService } from './services/oxlin-user.service';
import { OxlinLinkService } from './services/oxlin-link.service';
import { OxlinAuthService } from './services/oxlin-auth.service';
import { OxlinAccountService } from './services/oxlin-account.service';
import { OxlinConnectionService } from './services/oxlin-connection.service';

/**
 * Oxlin module
 */
@Module({
  imports: [ConfigModule, SharedModule],
  providers: [OxlinAuthService, OxlinUserService, OxlinLinkService, OxlinAccountService, OxlinConnectionService],
  exports: [OxlinAuthService, OxlinUserService, OxlinLinkService, OxlinAccountService, OxlinConnectionService],
})
export class OxlinModule {}
