import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { CustomHttpService } from './services/http.service';

/**
 * LinxoConnect module
 */
@Module({
  imports: [HttpModule],
  providers: [CustomHttpService],
  exports: [CustomHttpService],
})
export class SharedModule {}
