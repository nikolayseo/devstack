import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OutboxEvent } from '../outbox/outbox-event.entity.js';
import { KafkaService } from './kafka.service.js';

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer: NodeJS.Timeout | undefined;
  private publishing = false;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly events: Repository<OutboxEvent>,
    private readonly kafkaService: KafkaService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.publishPending();
    }, 1000);
    void this.publishPending();
  }

  private async publishPending() {
    if (this.publishing) {
      return;
    }

    this.publishing = true;
    try {
      const events = await this.events.find({
        where: { publishedAt: IsNull() },
        order: { createdAt: 'ASC' },
        take: 20,
      });

      for (const event of events) {
        try {
          await this.kafkaService.publishOutboxEvent(event);
          await this.events.update({ id: event.id }, { publishedAt: new Date() });
          this.logger.log(`Published outbox event id=${event.id} type=${event.eventType}`);
        } catch (error) {
          this.logger.error(`Failed to publish outbox event id=${event.id}`, error);
          break;
        }
      }
    } finally {
      this.publishing = false;
    }
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
