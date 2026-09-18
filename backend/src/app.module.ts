import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IndexingModule } from './indexing/indexing.module.js';
import { ProductsModule } from './products/products.module.js';
import { SearchModule } from './search/search.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
    }),
    IndexingModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        // Схемой управляют миграции, а не автогенерация.
        synchronize: false,
        migrationsRun: true,
        migrations: ['dist/migrations/*.js'],
        // Логировать каждый SQL-запрос можно только вне прода.
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    SearchModule,
    HealthModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
