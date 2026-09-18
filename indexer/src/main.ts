import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');

const app = await NestFactory.createMicroservice(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'devstack-indexer',
      brokers,
    },
    consumer: {
      groupId: 'catalog-search-indexer-nest',
    },
  },
});

await app.listen();
