import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client = new Client({
    node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  });

  async onModuleInit() {
    const info = await this.client.info();
    this.logger.log(`Connected to Elasticsearch cluster=${info.cluster_name}`);
  }

  async indexProduct(product: {
    id: number;
    name: string;
    category: string;
    price: number;
  }) {
    await this.client.index({
      index: 'products',
      id: String(product.id),
      document: product,
    });
  }
}
