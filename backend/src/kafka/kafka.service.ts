import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Admin, Consumer, Kafka, Producer } from 'kafkajs';
import { OutboxEvent } from '../outbox/outbox-event.entity.js';
import {
  KAFKA_DEMO_GROUP,
  KAFKA_DEMO_TOPIC,
  PRODUCT_CREATED_TOPIC,
} from './kafka.constants.js';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly brokers: string[];
  private readonly kafka: Kafka;
  private readonly admin: Admin;
  private readonly producer: Producer;
  private readonly demoConsumer: Consumer;

  constructor(config: ConfigService) {
    const brokers = config.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');
    this.brokers = brokers;

    this.kafka = new Kafka({
      clientId: 'devstack-backend',
      brokers,
    });
    this.admin = this.kafka.admin();
    this.producer = this.kafka.producer();
    this.demoConsumer = this.kafka.consumer({ groupId: KAFKA_DEMO_GROUP });
  }

  async onModuleInit() {
    await this.admin.connect();
    const topics = await this.admin.listTopics();
    const topicsToCreate = [KAFKA_DEMO_TOPIC, PRODUCT_CREATED_TOPIC]
      .filter((topic) => !topics.includes(topic))
      .map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 }));

    if (topicsToCreate.length > 0) {
      await this.admin.createTopics({
        waitForLeaders: true,
        topics: topicsToCreate,
      });
    }
    await this.producer.connect();
    await this.demoConsumer.connect();
    await this.demoConsumer.subscribe({ topic: KAFKA_DEMO_TOPIC, fromBeginning: true });

    await this.demoConsumer.run({
      eachMessage: async ({ partition, message }) => {
        const value = message.value?.toString() ?? '';
        this.logger.log(
          `Consumed topic=${KAFKA_DEMO_TOPIC} partition=${partition} offset=${message.offset} value=${value}`,
        );
      },
    });

    this.logger.log(`Kafka connected: brokers=${this.brokers.join(',')}`);
  }

  async publishDemo(payload: Record<string, unknown>) {
    const event = {
      eventId: crypto.randomUUID(),
      eventType: 'demo.event',
      occurredAt: new Date().toISOString(),
      payload,
    };

    await this.producer.send({
      topic: KAFKA_DEMO_TOPIC,
      messages: [
        {
          key: event.eventId,
          value: JSON.stringify(event),
        },
      ],
    });

    return event;
  }

  async publishProductCreated(product: {
    id: number;
    name: string;
    category: string;
    price: number;
  }) {
    const event = {
      eventId: crypto.randomUUID(),
      eventType: 'product.created',
      occurredAt: new Date().toISOString(),
      payload: product,
    };

    await this.producer.send({
      topic: PRODUCT_CREATED_TOPIC,
      messages: [{ key: String(product.id), value: JSON.stringify(event) }],
    });

    return event;
  }

  async publishOutboxEvent(event: OutboxEvent) {
    await this.producer.send({
      topic: PRODUCT_CREATED_TOPIC,
      messages: [{ key: event.aggregateId, value: JSON.stringify(event) }],
    });
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.admin.disconnect(),
      this.demoConsumer.disconnect(),
      this.producer.disconnect(),
    ]);
  }
}
