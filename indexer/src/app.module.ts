import { Module } from '@nestjs/common';
import { IndexerController } from './indexer.controller.js';
import { SearchService } from './search.service.js';

@Module({
  controllers: [IndexerController],
  providers: [SearchService],
})
export class AppModule {}
