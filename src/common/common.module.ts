import { Module } from '@nestjs/common';
import { LoggingModule } from './modules/logging.module';

@Module({
  imports: [LoggingModule],
  exports: [LoggingModule],
})
export class CommonModule {}
