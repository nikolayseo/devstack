import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { KafkaService } from './kafka.service.js';

@ApiTags('kafka')
@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Post('demo')
  @ApiOperation({ summary: 'Опубликовать учебное событие Kafka' })
  @ApiResponse({ status: 201, description: 'Событие опубликовано в Kafka' })
  publishDemo(@Body() payload: Record<string, unknown>) {
    return this.kafkaService.publishDemo(payload);
  }
}
