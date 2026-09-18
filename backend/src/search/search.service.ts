import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly client: Client;
  private readonly logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    try {
      const info = await this.client.info();
      this.logger.log(`Elasticsearch connected: ${info.cluster_name}`);
    } catch (error) {
      this.logger.error('Elasticsearch connection failed', error);
    }
  }

  /**
   * Состояние кластера для health-check.
   * Ключ "status" зарезервирован Terminus — отдаём как clusterStatus.
   */
  async clusterHealth() {
    const res = await this.client.cluster.health();
    return {
      cluster: res.cluster_name,
      clusterStatus: res.status,
      nodes: res.number_of_nodes,
    };
  }

  async index(indexName: string, id: string, body: Record<string, unknown>) {
    return this.client.index({
      index: indexName,
      id,
      document: body,
    });
  }

  async search(indexName: string, query: string) {
    const result = await this.client.search({
      index: indexName,
      query: {
        multi_match: {
          query,
          fields: ['name', 'category'],
          fuzziness: 'AUTO',
        },
      },
    });

    return result.hits.hits.map((hit: any) => ({
      score: hit._score,
      ...hit._source as Record<string, unknown>,
    }));
  }
}
