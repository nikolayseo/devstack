import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SearchService } from '../search/search.service.js';
import { PRODUCT_INDEXING_QUEUE } from './indexing.constants.js';

@Processor(PRODUCT_INDEXING_QUEUE)
export class IndexingProcessor extends WorkerHost {
  private readonly logger = new Logger(IndexingProcessor.name);

  constructor(private readonly searchService: SearchService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Indexing product #${job.data.id}...`);

    await this.searchService.index('products', String(job.data.id), {
      name: job.data.name,
      category: job.data.category,
      price: job.data.price,
    });

    this.logger.log(`Product #${job.data.id} indexed successfully`);
  }
}
