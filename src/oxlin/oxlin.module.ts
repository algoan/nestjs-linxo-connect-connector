import { Module } from '@nestjs/common';

import { SharedModule } from '../shared/shared.module';
import { ConfigModule } from '../config/config.module';
import { OxlinUserService } from './services/oxlin-user.service';
import { OxlinLinkService } from './services/oxlin-link.service';
import { OxlinAuthService } from './services/oxlin-auth.service';

/**
 * Oxlin module
 */
@Module({
  imports: [ConfigModule, SharedModule],
  providers: [OxlinAuthService, OxlinUserService, OxlinLinkService],
  exports: [OxlinAuthService, OxlinUserService, OxlinLinkService],
})
export class OxlinModule {}
