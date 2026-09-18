import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health.js';
import { ElasticsearchHealthIndicator } from './elasticsearch.health.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly elasticsearch: ElasticsearchHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Проверка живости всех зависимостей' })
  @ApiResponse({ status: 200, description: 'Все зависимости доступны' })
  @ApiResponse({ status: 503, description: 'Хотя бы одна зависимость недоступна' })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 2000 }),
      () => this.redis.isHealthy('redis'),
      () => this.elasticsearch.isHealthy('elasticsearch'),
    ]);
  }
}
