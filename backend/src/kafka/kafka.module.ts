import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../outbox/outbox-event.entity.js';
import { KafkaController } from './kafka.controller.js';
import { OutboxPublisher } from './outbox.publisher.js';
import { KafkaService } from './kafka.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  controllers: [KafkaController],
  providers: [KafkaService, OutboxPublisher],
  exports: [KafkaService],
})
export class KafkaModule {}
