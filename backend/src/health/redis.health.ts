import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Redis } from 'ioredis';

/**
 * Проверка живости Redis через настоящий PING.
 *
 * enableOfflineQueue: false — команда падает сразу, если соединения нет,
 * а не висит в очереди до таймаута health-check'а.
 * maxRetriesPerRequest: 1 — не ретраить долго, health должен отвечать быстро.
 */
@Injectable()
export class RedisHealthIndicator implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    config: ConfigService,
  ) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: Number(config.get<string>('REDIS_PORT', '6379')),
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    // Без этого ioredis бросает unhandled 'error' и засоряет логи при недоступном Redis.
    this.client.on('error', () => undefined);
  }

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        const response = await this.client.ping();
        return { response };
      })
      .withTimeout(2000);
  }

  async onModuleDestroy() {
    await this.client.quit().catch(() => undefined);
  }
}
