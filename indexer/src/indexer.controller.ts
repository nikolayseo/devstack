import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SearchService } from './search.service.js';

const PRODUCT_CREATED_TOPIC = 'catalog.product-events';

type ProductCreatedEvent = {
  id: string;
  eventType: 'product.created';
  occurredAt: string;
  payload: {
    id: number;
    name: string;
    category: string;
    price: number;
  };
};

@Controller()
export class IndexerController {
  private readonly logger = new Logger(IndexerController.name);

  constructor(private readonly searchService: SearchService) {}

  @EventPattern(PRODUCT_CREATED_TOPIC)
  async handleProductCreated(@Payload() event: ProductCreatedEvent) {
    await this.searchService.indexProduct(event.payload);
    this.logger.log(
      `Indexed product event=${event.id} productId=${event.payload.id}`,
    );
  }
}
