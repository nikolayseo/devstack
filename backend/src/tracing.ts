/**
 * OpenTelemetry bootstrap — MUST be imported BEFORE NestJS starts.
 *
 * Автоматически подхватывает HTTP-запросы, Postgres (pg), Redis (ioredis) и BullMQ.
 * Экспортирует span'ы в Jaeger через OTLP/HTTP.
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  // NodeSDK сам создаст Resource с правильным service.name
  serviceName: 'devstack-backend',
  traceExporter: new OTLPTraceExporter({
    // Jaeger принимает OTLP/HTTP на порту 4318
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Отключаем file-system инструментацию — она генерирует слишком много шума
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();

// Корректная остановка при завершении процесса — сбрасывает буфер span'ов
process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error);
});

