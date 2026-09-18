import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { SearchService } from '../search/search.service.js';

/**
 * Проверка живости Elasticsearch через cluster health.
 *
 * Важно: ключ "status" зарезервирован Terminus, поэтому цвет кластера
 * возвращается как clusterStatus.
 */
@Injectable()
export class ElasticsearchHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly searchService: SearchService,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => this.searchService.clusterHealth())
      .withTimeout(3000);
  }
}
