# FAANG-стек: полный каталог технологий и порядок изучения

> Дополнение к `DEVSTACK-HANDOFF.md`. Это карта всего, что нужно освоить для уровня senior/staff в бигтехе — с разбором «когда что выбирать» и в каком порядке учить.
>
> **Для нейросети-учителя:** это справочник, а не план одного урока. Используй его, чтобы (а) понимать, куда движется ученик, (б) выбирать следующую тему, (в) отвечать на вопросы «а чем X отличается от Y». Правило прежнее: **теория только по пройденному материалу**, не забегай вперёд.

---

# КАК ЧИТАТЬ ЭТУ КАРТУ

Технологий тут ~150. Выучить все невозможно и не нужно. Работает такой принцип:

**Глубоко знать 1–2 инструмента из каждой категории + понимать trade-off'ы остальных.** На собеседовании в FAANG не спрашивают «какие флаги у Kafka». Спрашивают «у нас 100k событий в секунду, нужна гарантия доставки и переигрывание истории — что возьмёшь и почему». Ответ «Kafka, потому что она хранит лог и позволяет читать с любого offset, а RabbitMQ удаляет сообщение после ack» — это senior-уровень.

Каждая категория ниже размечена приоритетом:

- 🔴 **Must have** — без этого не берут на senior. Учить обязательно.
- 🟡 **Should have** — сильно повышает грейд, спрашивают регулярно.
- 🟢 **Nice to have** — специализация, учить по необходимости.

---

# ТИР 0 — ФУНДАМЕНТ 🔴

Это не «технологии», а база, без которой всё остальное — карго-культ. В FAANG на system design это спрашивают в первую очередь.

### Сети и протоколы
- **TCP/IP, UDP** — рукопожатие, congestion control, почему TCP «медленный» на нестабильных сетях.
- **HTTP/1.1 → HTTP/2 → HTTP/3 (QUIC)** — head-of-line blocking, мультиплексирование, почему HTTP/3 поверх UDP.
- **TLS/mTLS** — рукопожатие, сертификаты, зачем взаимная аутентификация между сервисами.
- **DNS** — резолвинг, TTL, service discovery через DNS (ты это уже трогал: контейнеры видят друг друга по именам сервисов).
- **WebSocket, Server-Sent Events, long polling** — когда что.
- **Балансировка L4 vs L7** — на уровне TCP или HTTP, и почему это разные инструменты.

### Операционные системы и Linux
- Процессы, потоки, файловые дескрипторы, сигналы.
- **Namespaces, cgroups, capabilities** — ты это уже проходил на Docker, но стоит углубить.
- I/O модели: blocking, non-blocking, epoll, io_uring.
- Инструменты диагностики: `strace`, `lsof`, `htop`, `iostat`, `tcpdump`, `ss`.

### Базы данных — теория
- **ACID**, уровни изоляции транзакций, phantom read / dirty read / non-repeatable read.
- **Индексы**: B-tree, hash, GIN/GiST, покрывающие индексы, почему индекс может не использоваться.
- **EXPLAIN ANALYZE** — читать план запроса. Это то, чем отличается senior от junior.
- **Нормализация и денормализация** — когда осознанно дублировать данные.
- **N+1 проблема** — классика ORM (у тебя TypeORM, ты с этим встретишься).

### Распределённые системы — теория 🔴
Самое важное для FAANG-собеседований.

- **CAP-теорема** и её честная трактовка (PACELC).
- **Согласованность**: strong, eventual, causal, read-your-writes.
- **Consensus**: Raft, Paxos — на пальцах, как работает выбор лидера.
- **Идемпотентность** — почему каждый API, меняющий состояние, должен её иметь.
- **Exactly-once иллюзия** — почему её не существует, и что есть at-least-once + идемпотентность.
- **Consistent hashing** — как шардируют данные и почему не по `hash % N`.
- **Vector clocks, Lamport timestamps** — упорядочивание событий без общих часов.
- **Two-phase commit и почему его избегают** → отсюда растёт Saga.
- **Backpressure** — что делать, когда потребитель медленнее производителя.

### Алгоритмы и структуры
Для интервью: массивы, хеш-таблицы, деревья, графы (BFS/DFS), два указателя, sliding window, динамическое программирование, кучи. Плюс оценка сложности. Это отдельный трек (LeetCode), параллельный инженерному.

---

# ТИР 1 — ЯДРО ПРОДАКШЕНА

## 1. Очереди и стриминг 🔴

Твой следующий большой блок. Разбор различий — самая частая тема на собеседованиях.

### Apache Kafka 🔴
**Что это:** распределённый **лог** событий, а не очередь. Сообщения не удаляются после чтения — они лежат в топике заданное время (retention), и любой consumer может читать с любого offset.

**Ключевые понятия:** topic, partition, offset, consumer group, replication factor, ISR (in-sync replicas), leader election, log compaction, exactly-once semantics (транзакции), Kafka Connect, Kafka Streams, Schema Registry (Avro/Protobuf).

**Когда брать:** нужна история событий, переигрывание, высокая пропускная способность (сотни тысяч msg/s), несколько независимых потребителей одного потока, event sourcing, CDC.

**Когда НЕ брать:** нужны сложные роуты сообщений, приоритеты, per-message TTL, или просто фоновые задачи в маленьком проекте — Kafka тяжеловесна в эксплуатации.

**Где используют:** LinkedIn (родина), Netflix, Uber, практически весь бигтех как «нервная система» данных.

### NATS / NATS JetStream 🟡
**Что это:** очень лёгкий и очень быстрый брокер. Ядро NATS — fire-and-forget pub/sub без персистентности (микросекундные задержки). **JetStream** — надстройка, добавляющая персистентность, streams, consumers, key-value store и object store.

**Ключевые понятия:** subject (с wildcards `orders.*.created`), queue groups, request-reply (встроенный RPC!), streams, durable consumers, leaf nodes, супер-кластеры.

**Когда брать:** нужна минимальная задержка, простая эксплуатация (один бинарник на Go, ~15 МБ, без ZooKeeper), request-reply между сервисами, edge/IoT, multi-region с супер-кластерами.

**Kafka vs NATS одной фразой:** Kafka — «архив событий, который можно перечитывать», NATS — «нервные импульсы здесь и сейчас» (JetStream закрывает разрыв, но Kafka сильнее в аналитических объёмах и экосистеме).

### RabbitMQ 🟡
**Что это:** классический брокер очередей на AMQP. Умный брокер, глупый клиент.

**Ключевые понятия:** exchange (direct, topic, fanout, headers), binding, queue, ack/nack, dead-letter queue, prefetch, приоритеты, per-message TTL.

**Когда брать:** сложная маршрутизация, приоритеты задач, классический task queue, нужны гарантии на уровне отдельного сообщения. Проще Kafka в освоении.

**Когда НЕ брать:** очень большие объёмы, нужна история и переигрывание.

### Остальные в категории
- **Redpanda** 🟢 — Kafka-совместимый брокер на C++, без JVM и ZooKeeper, в разы меньше задержка. Drop-in замена Kafka.
- **Apache Pulsar** 🟢 — Kafka-подобный, но с разделением compute/storage (BookKeeper), встроенный multi-tenancy и геореплика. Yahoo, Tencent.
- **AWS SQS / SNS / Kinesis, GCP Pub/Sub** 🟡 — управляемые аналоги в облаке. SQS = очередь, SNS = pub/sub, Kinesis = Kafka-подобный стрим.
- **BullMQ** 🔴 (для тебя) — очередь задач поверх Redis, идеальна для Node.js. Твой следующий практический шаг, потому что Redis уже стоит.
- **Temporal / Cadence** 🟡 — не брокер, а **оркестратор долгоживущих workflow**. Пишешь бизнес-процесс обычным кодом, а Temporal гарантирует его выполнение через падения, ретраи и рестарты, месяцами. Uber, Netflix, Snap, Stripe. Очень мощная штука, недооценённая.

### Паттерны обмена сообщениями 🔴
- **Outbox pattern** — решение dual write (ты уже знаешь проблему): пишешь бизнес-данные и событие в одной транзакции БД, отдельный процесс вычитывает outbox-таблицу и публикует в брокер.
- **Saga** — распределённая транзакция как цепочка локальных транзакций с компенсирующими действиями. Хореография (через события) vs оркестрация (через координатор).
- **Event sourcing** — состояние хранится не как снимок, а как последовательность событий. Текущее состояние = свёртка (fold) всех событий.
- **CQRS** — ты уже применил (запись в Postgres, чтение из ES).
- **Dead-letter queue, retry с exponential backoff + jitter, poison message.**
- **Идемпотентные consumer'ы** — дедупликация по ключу.

---

## 2. Базы данных 🔴

### Реляционные
- **PostgreSQL** 🔴 — твоя основная, учить глубоко: MVCC, VACUUM и bloat, WAL, репликация (streaming, логическая), партиционирование, connection pooling, `EXPLAIN`, оконные функции, CTE, JSONB, полнотекстовый поиск.
  - **Расширения:** `pgvector` (векторный поиск для AI), `PostGIS` (гео), `TimescaleDB` (временные ряды), `pg_stat_statements` (профилирование запросов).
- **MySQL / MariaDB** 🟡 — второй по распространённости. InnoDB, отличия от Postgres.
- **PgBouncer / Pgpool** 🔴 — пул соединений. Без него Postgres захлёбывается: каждое соединение — отдельный процесс.

### Распределённые SQL (NewSQL) 🟡
- **CockroachDB** — Postgres-совместимый, горизонтально масштабируемый, geo-distributed.
- **Vitess** — шардирование MySQL. Родом из YouTube, на нём Slack и GitHub.
- **Citus** — шардирование Postgres (теперь часть Microsoft).
- **TiDB, YugabyteDB** — альтернативы CockroachDB.
- **Google Spanner** — глобально консистентная БД с атомными часами. Легенда, читать whitepaper.

### NoSQL 🟡
- **MongoDB** — документная. Когда схема гибкая. Осторожно с транзакциями между документами.
- **Cassandra / ScyllaDB** — wide-column, write-optimized, линейное масштабирование, eventual consistency, tunable consistency. Scylla — переписанная на C++ Cassandra, кратно быстрее. Discord, Netflix.
- **DynamoDB** — управляемая key-value/document от AWS. Обязательно прочитать оригинальный **Dynamo paper** — это база теории распределённых хранилищ.
- **etcd** — распределённый key-value на Raft. Сердце Kubernetes.

### Аналитические (OLAP) 🟡
- **ClickHouse** — колоночная, безумно быстрая на агрегациях. Стандарт де-факто для аналитики и логов сейчас.
- **Apache Druid, Apache Pinot** — real-time OLAP (Pinot родом из LinkedIn).
- **DuckDB** — «SQLite для аналитики», в процессе, без сервера.
- **Snowflake, BigQuery, Redshift** — облачные хранилища данных.

### Специализированные 🟢
- **Neo4j / ArangoDB** — графовые. Соцграфы, рекомендации, fraud detection.
- **InfluxDB, VictoriaMetrics, Prometheus TSDB** — временные ряды.
- **Vector DB** (см. раздел AI): Qdrant, Weaviate, Milvus, pgvector.

---

## 3. Кэширование 🔴

- **Redis** 🔴 — ты уже поднял, но не использовал. Учить: структуры данных (string, hash, list, set, sorted set, stream, HyperLogLog, bitmap), persistence (RDB vs AOF), eviction policies, Redis Cluster, Sentinel, pub/sub, Lua-скрипты, distributed lock (Redlock и его критика).
- **Valkey** 🟡 — форк Redis после смены лицензии, поддержан Linux Foundation, AWS и Google. Возможно, будущий стандарт.
- **Dragonfly** 🟢 — совместимая с Redis, но многопоточная, кратно быстрее на многоядерных машинах.
- **Memcached** 🟢 — проще Redis, только строки, но очень быстрый и предсказуемый.

**Паттерны кэширования** 🔴: cache-aside (lazy loading), read-through, write-through, write-behind, refresh-ahead. Проблемы: **cache stampede** (thundering herd), **hot key**, инвалидация. Многоуровневый кэш: браузер → CDN → приложение (in-memory) → Redis → БД.

---

## 4. Поиск 🟡

- **Elasticsearch / OpenSearch** 🔴 — ты уже используешь. Углублять: маппинги и анализаторы, шардирование и реплики, релевантность (BM25), агрегации, boosting, синонимы, ILM (index lifecycle management), почему нельзя менять маппинг задним числом. OpenSearch — форк AWS после смены лицензии Elastic.
- **Meilisearch / Typesense** 🟢 — лёгкие альтернативы для продуктового поиска, работают из коробки, но не про аналитику.
- **Apache Solr** 🟢 — старший брат на том же Lucene.
- **Vespa** 🟢 — от Yahoo, поиск + ML-ранжирование в одном. Очень мощный, редкий.

---

## 5. API-слой 🔴

- **REST + OpenAPI/Swagger** 🔴 — база. Правильные коды ответов, версионирование, пагинация (offset vs cursor), HATEOAS, идемпотентные ключи.
- **GraphQL** 🟡 — Apollo Server / Federation, DataLoader (решение N+1), persisted queries, ограничение глубины запроса. GitHub, Shopify, Netflix.
- **gRPC + Protocol Buffers** 🔴 — стандарт для межсервисного взаимодействия в бигтехе. Бинарный, HTTP/2, стриминг в обе стороны, кодогенерация. Быстрее REST в разы.
- **tRPC** 🟢 — end-to-end типобезопасность для TypeScript-моно-репо. Приятно, но только для TS.
- **AsyncAPI** 🟢 — как OpenAPI, но для событийных API.
- **BFF (Backend for Frontend)** 🟡 — отдельный API-слой под каждый клиент (веб, мобилка).
- **API Gateway** 🔴 — Kong, KrakenD, Tyk, AWS API Gateway. Аутентификация, rate limiting, роутинг в одной точке.

---

## 6. Reverse proxy, service mesh, сеть 🟡

- **Nginx** 🔴 — ты уже используешь во фронт-контейнере.
- **Traefik** 🔴 — в твоём плане. Авто-обнаружение сервисов через Docker labels, авто-TLS через Let's Encrypt.
- **Envoy** 🔴 — прокси нового поколения, основа большинства service mesh. xDS API, динамическая конфигурация.
- **HAProxy** 🟢 — очень быстрый L4/L7 балансировщик.
- **Istio** 🟡 — самый функциональный service mesh: mTLS между сервисами, трафик-менеджмент (канареечные релизы на уровне сети), observability из коробки. Тяжёлый.
- **Linkerd** 🟡 — легче Istio, проще в эксплуатации, на Rust.
- **Cilium / eBPF** 🟡 — сетевая безопасность и наблюдаемость на уровне ядра Linux, без sidecar'ов. Очень горячая тема сейчас.

**Паттерны устойчивости** 🔴 (must know): **circuit breaker**, **bulkhead**, **retry с backoff + jitter**, **timeout на каждый вызов**, **rate limiting** (token bucket, leaky bucket, sliding window), **load shedding**, **graceful degradation**, **hedged requests**.

---

## 7. Контейнеры и оркестрация 🔴

- **Docker** 🔴 — у тебя есть. Углублять: multi-stage (уже сделал), distroless-образы, non-root user, слои и кэш, BuildKit, сканирование уязвимостей.
- **Kubernetes** 🔴 — обязателен для senior. Учить: Pod, Deployment, StatefulSet, DaemonSet, Service, Ingress, ConfigMap, Secret, PVC, namespace, RBAC, liveness/readiness/startup probes, requests/limits, HPA/VPA, PodDisruptionBudget, affinity/taints/tolerations, operators и CRD.
  - Локально: **k3s**, **kind**, **minikube**.
- **Helm** 🔴 — пакетный менеджер для k8s. **Kustomize** 🟡 — альтернатива через оверлеи.
- **ArgoCD / FluxCD** 🔴 — **GitOps**: git как единственный источник истины, кластер сам подтягивает состояние. Стандарт деплоя сейчас.
- **KEDA** 🟡 — автоскейлинг по внешним метрикам (длина очереди Kafka, например).
- **HashiCorp Nomad** 🟢 — простая альтернатива k8s.

---

## 8. Infrastructure as Code 🔴

- **Terraform / OpenTofu** 🔴 — декларативное создание облачных ресурсов. State, модули, workspaces, `plan`/`apply`, drift detection. OpenTofu — открытый форк после смены лицензии HashiCorp.
- **Pulumi** 🟡 — то же самое, но на настоящих языках (TypeScript, Go, Python).
- **Ansible** 🟡 — конфигурация серверов (не создание). Playbooks, idempotency.
- **Crossplane** 🟢 — управление облаком через Kubernetes API.
- **Packer** 🟢 — сборка образов машин.

---

## 9. CI/CD 🔴

- **GitHub Actions** 🔴 — в твоём плане. Матрицы, кэш, переиспользуемые workflow, OIDC вместо долгоживущих секретов, environments и approvals.
- **GitLab CI, Jenkins, Buildkite, CircleCI, Tekton, Dagger** 🟡 — альтернативы, знать существование.

**Стратегии деплоя** 🔴: rolling update, **blue-green**, **canary** (постепенный процент трафика), **feature flags** (LaunchDarkly, Unleash, GrowthBook, Flagsmith) — деплой отделён от релиза, **shadow traffic** (дублирование боевого трафика на новую версию без влияния на пользователя), автоматический откат по метрикам.

**Артефакты и реестры** 🟡: Docker Registry, Harbor, JFrog Artifactory, GitHub Packages. Подпись образов: **Cosign / Sigstore**. **SBOM** (software bill of materials). **Supply chain security** — очень актуально после атак на xz и SolarWinds.

---

## 10. Наблюдаемость (Observability) 🔴

Три столпа: метрики, логи, трейсы. Плюс четвёртый — профилирование.

- **OpenTelemetry** 🔴 — единый стандарт сбора всей телеметрии. Учить в первую очередь, он вытесняет вендорские SDK.
- **Prometheus** 🔴 — метрики, pull-модель, PromQL, recording rules, alerting rules, exporters. Долговременное хранение: **Thanos**, **Cortex/Mimir**, **VictoriaMetrics**.
- **Grafana** 🔴 — дашборды поверх всего.
- **Loki** 🟡 — логи «как Prometheus»: индексируются только метки, а не содержимое. Дёшево.
- **Jaeger / Tempo / Zipkin** 🔴 — distributed tracing. Trace ID через все сервисы, span'ы, waterfall-диаграмма запроса. Это то, чем находят «почему один запрос из тысячи тормозит».
- **ELK / EFK** 🟡 — Elasticsearch + Logstash/Fluentd + Kibana. Классика для логов, тяжелее Loki.
- **Sentry** 🔴 — трекинг ошибок и релизов, фронт и бэк.
- **Pyroscope / Parca** 🟢 — continuous profiling (CPU/память в проде постоянно).
- **Datadog, New Relic, Honeycomb** 🟡 — коммерческие all-in-one. Honeycomb — идеолог «observability-driven development».

**Практики SRE** 🔴: **SLI / SLO / SLA**, **error budget** (и как он останавливает релизы), **RED-метрики** (Rate, Errors, Duration) для сервисов, **USE-метрики** (Utilization, Saturation, Errors) для ресурсов, **золотые сигналы Google**, alert fatigue и алерты на симптомы, а не причины, **runbooks**, **blameless postmortem**, **on-call rotation**, **incident command system**. Читать: **Google SRE Book** (бесплатно онлайн) — это библия.

---

## 11. Безопасность 🔴

- **Аутентификация и авторизация** 🔴: OAuth 2.0 + OIDC (и в чём разница), JWT (и почему его нельзя использовать как сессию бездумно), refresh-токены, PKCE, SAML. Серверы: **Keycloak** (self-hosted), Auth0, Okta, **Ory** (Kratos/Hydra).
- **RBAC / ABAC / ReBAC** 🟡 — модели доступа. **OpenFGA / SpiceDB** — реализация Google Zanzibar (граф отношений, «кто на что имеет право»).
- **OPA (Open Policy Agent) + Rego** 🟡 — policy as code, единые правила доступа для всей инфраструктуры.
- **HashiCorp Vault** 🔴 — секреты, динамические креды (БД выдаёт временного пользователя на 1 час), шифрование как сервис, PKI.
- **SOPS / Sealed Secrets / External Secrets Operator** 🟡 — секреты в git безопасно.
- **mTLS + SPIFFE/SPIRE** 🟡 — криптографическая идентичность сервисов. Zero-trust архитектура.
- **Сканирование** 🔴: Trivy, Grype, Snyk (зависимости и образы), Semgrep/CodeQL (SAST — статический анализ), OWASP ZAP (DAST), Dependabot/Renovate (обновление зависимостей).
- **Runtime security** 🟢: Falco, Tetragon (обнаружение аномалий в проде через eBPF).
- **OWASP Top 10** 🔴 — обязательно наизусть: injection, broken auth, XSS, SSRF, IDOR, misconfiguration.
- **Rate limiting, WAF, DDoS-защита (Cloudflare)** 🟡.
- **Секретная гигиена** 🔴: никогда не коммитить секреты, ротация, принцип наименьших привилегий, короткоживущие токены.

---

## 12. Тестирование 🔴

- **Пирамида тестов**: много unit → меньше integration → мало e2e. И контр-подход «testing trophy» для фронта.
- **Unit**: Vitest / Jest (у тебя Vitest), моки vs стабы vs фейки.
- **Integration**: **Testcontainers** 🔴 — поднимает настоящий Postgres/Kafka в Docker на время теста. Убивает целый класс «на моках работало».
- **E2E API**: Supertest, REST Assured.
- **E2E UI**: **Playwright** 🔴 (современный стандарт), Cypress.
- **Contract testing**: **Pact** 🟡 — гарантия, что сервисы не сломают друг другу API. Критично для микросервисов.
- **Load testing** 🔴: **k6** (на JS, приятный), Gatling, Locust, JMeter, Vegeta. Понимать разницу: load / stress / spike / soak тесты.
- **Chaos engineering** 🟡: Chaos Mesh, Litmus, Gremlin. Netflix Chaos Monkey — родоначальник. Специально ломаем прод, чтобы проверить устойчивость.
- **Property-based testing** 🟢: fast-check. Генерирует входные данные сам.
- **Mutation testing** 🟢: Stryker. Проверяет качество самих тестов.

---

## 13. Данные и Data Engineering 🟡

- **Debezium** 🔴 — CDC (Change Data Capture): читает WAL Postgres и стримит изменения в Kafka. Правильное решение твоей проблемы dual write на большом масштабе.
- **Apache Airflow** 🟡 — оркестрация пайплайнов (DAG). Классика.
- **Dagster / Prefect** 🟢 — современные альтернативы Airflow, data-aware.
- **dbt** 🟡 — трансформации в хранилище на SQL, с тестами и версионированием. Стандарт аналитической инженерии.
- **Apache Spark** 🟡 — распределённая обработка больших данных, batch и streaming.
- **Apache Flink** 🟡 — настоящий стриминг с состоянием, event time, watermarks, exactly-once. Сильнее Spark Streaming в real-time.
- **Apache Iceberg / Delta Lake / Hudi** 🟡 — табличные форматы для озёр данных, ACID поверх S3. Iceberg сейчас побеждает.
- **Kafka Connect** 🟡 — готовые коннекторы источник→Kafka→приёмник без кода.
- **Feature store (Feast)** 🟢 — хранилище признаков для ML.
- **Data mesh, medallion architecture (bronze/silver/gold)** 🟢 — организационные подходы.

---

## 14. Хранилище файлов 🟡

- **MinIO** 🔴 — в твоём плане. S3-совместимое, self-hosted.
- **AWS S3** 🔴 — классы хранения, lifecycle policies, presigned URLs, versioning, event notifications.
- **Ceph** 🟢 — распределённое хранилище (блочное, объектное, файловое).
- **CDN** 🔴: CloudFront, Cloudflare, Fastly. Edge-кэширование, инвалидация, cache-control заголовки.

---

## 15. Frontend на масштабе 🟡

Ты сделал Vite + React. Что дальше в бигтехе:

- **Next.js / Remix** 🔴 — SSR, SSG, ISR, RSC (React Server Components), streaming. Понимать, зачем рендерить на сервере (SEO, Core Web Vitals, TTFB).
- **Управление состоянием**: TanStack Query (серверное состояние — самое важное), Zustand / Jotai (клиентское), Redux Toolkit (легаси, но живой).
- **Micro-frontends / Module Federation** 🟢 — когда над фронтом работает 10 команд.
- **Design system + Storybook** 🟡 — компонентная библиотека как продукт.
- **Core Web Vitals** 🔴 — LCP, INP, CLS. Это метрики, за которые в продуктовых компаниях реально спрашивают.
- **Bundle optimization** 🟡 — code splitting, tree shaking, lazy loading, анализ бандла.
- **Accessibility (a11y)** 🟡 — WCAG, семантика, ARIA. В США это юридическое требование.
- **Real User Monitoring** 🟡 — метрики с реальных браузеров, а не из лаборатории.

---

## 16. Языки и рантаймы 🟡

Node.js/TypeScript у тебя есть. В бигтехе почти всегда полиглот-стек:

- **Go** 🔴 — язык инфраструктуры. На нём написаны Docker, Kubernetes, Terraform, Prometheus, NATS. Простой, быстрый, отличная конкурентность (горутины, каналы). Если учить второй язык — этот.
- **Rust** 🟡 — где нужна максимальная производительность и безопасность памяти. Растёт очень быстро.
- **Java / Kotlin** 🟡 — по-прежнему доминируют в энтерпрайзе и бигтехе (Netflix, Uber). JVM, GC-тюнинг, Spring Boot.
- **Python** 🟡 — данные, ML, скрипты, автоматизация.

**Concurrency-модели** 🔴: event loop (Node), горутины и CSP (Go), потоки и пулы (Java), async/await, актор-модель (Erlang/Akka). Понимать разницу между конкурентностью и параллелизмом.

---

## 17. Архитектура 🔴

- **Монолит vs модульный монолит vs микросервисы** — и почему «начинай с монолита» сейчас мейнстрим-совет. Модульный монолит как золотая середина.
- **Domain-Driven Design** 🔴: bounded context, aggregate, ubiquitous language, anti-corruption layer. Именно DDD говорит, ГДЕ резать на сервисы.
- **Hexagonal / Clean / Onion architecture** 🟡 — порты и адаптеры, изоляция домена от инфраструктуры. NestJS к этому располагает.
- **12-Factor App** 🔴 — ты уже частично проходил. Перечитать целиком.
- **Strangler Fig pattern** 🟡 — как мигрировать легаси по кускам.
- **Sidecar, ambassador, adapter** 🟡 — контейнерные паттерны.
- **Multi-tenancy** 🟡 — изоляция клиентов: отдельная БД / отдельная схема / общая таблица с tenant_id.
- **Идемпотентность и exactly-once** 🔴 — повторю, потому что это спрашивают всегда.
- **System design интервью** 🔴 — отдельный навык: спроектировать Twitter / Uber / TinyURL / Netflix. Оценка нагрузки на салфетке (back-of-the-envelope), выбор хранилища, шардирование, кэш, CDN, очереди. Ресурс: книга «System Design Interview» Алекса Сюя.

---

## 18. Платформенная инженерия 🟢

Новое направление, растёт быстро.

- **Backstage** (от Spotify) — внутренний портал разработчика: каталог сервисов, шаблоны, документация в одном месте.
- **Golden paths** — «проторённые дорожки»: команда создаёт сервис из шаблона и сразу получает CI, мониторинг, алерты, деплой.
- **Internal Developer Platform (IDP)** — идея, что инфраструктура должна быть продуктом для внутренних пользователей.
- **DORA-метрики** 🔴 — четыре метрики зрелости: deployment frequency, lead time for changes, change failure rate, MTTR. Их реально меряют в бигтехе.

---

## 19. AI/ML инфраструктура 🟡

Обязательно в 2026 — почти каждая вакансия это трогает.

- **Векторные БД**: **pgvector** (проще всего, у тебя уже Postgres), Qdrant, Weaviate, Milvus, Pinecone.
- **RAG (Retrieval-Augmented Generation)** 🔴 — чанкинг, эмбеддинги, гибридный поиск (вектор + BM25 из Elasticsearch — ты уже на полпути), реранкинг.
- **LLM-шлюзы**: LiteLLM, Portkey — единый интерфейс к разным моделям, кэш, лимиты, логирование.
- **Serving**: vLLM, TGI, Triton Inference Server, Ollama (локально).
- **Оркестрация**: LangChain / LlamaIndex (осторожно, много абстракций), или прямые вызовы API.
- **MLOps**: MLflow (эксперименты и реестр моделей), Kubeflow, DVC (версионирование данных).
- **Evals и observability для LLM**: Langfuse, LangSmith, Braintrust. Тестирование недетерминированных систем — отдельная дисциплина.
- **Model Context Protocol (MCP)** 🟡 — стандарт подключения инструментов к LLM-агентам.

---

# РЕКОМЕНДОВАННЫЙ ПОРЯДОК ДЛЯ ТЕБЯ

Продолжение твоего курса. Каждый шаг опирается на предыдущий.

| # | Тема | Почему сейчас |
|---|---|---|
| 8 | **Dockerize** (доделать) | Уже начато |
| 10 | Миграции + healthchecks + Swagger + валидация | Делает текущий бэкенд продовым |
| 11 | **BullMQ на Redis** | Redis простаивает; убирает dual write; вводит асинхронность |
| 12 | **Observability**: Prometheus + Grafana + OpenTelemetry + Jaeger | Без этого дальше вслепую |
| 13 | **Auth**: JWT + Passport + guards + throttler | Любое приложение упирается в это |
| 14 | **Тесты + CI/CD**: Vitest, Testcontainers, Playwright, GitHub Actions | Автоматизация качества |
| 15 | **Traefik** вместо nginx + TLS | Правильный edge |
| 16 | **Kafka** (или NATS JetStream) + outbox pattern | Настоящая event-driven архитектура |
| 17 | **Kubernetes (k3s)** + Helm + ArgoCD | Оркестрация и GitOps |
| 18 | **Terraform** | Инфраструктура как код |
| 19 | **MinIO** + загрузка файлов | Работа с объектным хранилищем |
| 20 | **pgvector + RAG** | AI-слой поверх готового стека |

Параллельно с любым уроком: **Go** (второй язык), **LeetCode** (алгоритмы), **System Design** (интервью).

---

# ЧТО ЧИТАТЬ

**Книги, которые реально меняют уровень:**
- **«Designing Data-Intensive Applications»**, Martin Kleppmann — главная книга инженера распределённых систем. Читать обязательно, дважды.
- **«Site Reliability Engineering»** (Google) — бесплатно на sre.google/books.
- **«System Design Interview» Vol. 1 & 2**, Alex Xu — для интервью.
- **«Database Internals»**, Alex Petrov — как БД устроены изнутри.
- **«Fundamentals of Software Architecture»**, Richards & Ford.
- **«Release It!»**, Michael Nygard — паттерны устойчивости (circuit breaker пришёл отсюда).
- **«Domain-Driven Design Distilled»**, Vaughn Vernon — короткий вход в DDD.

**Whitepapers (классика, читать в оригинале):**
Google MapReduce, GFS, Bigtable, Spanner, Borg, Dapper (трейсинг), Chubby; Amazon Dynamo; Facebook TAO; Kafka (LinkedIn); Raft.

**Регулярно:**
Инженерные блоги Netflix, Uber, Airbnb, Discord, Cloudflare, Stripe. Рассылки: The Pragmatic Engineer, ByteByteGo, SRE Weekly.

---

# ГЛАВНОЕ

Список выше выглядит бесконечным, и это нормально — никто не знает всё. Разница между middle и staff не в количестве выученных инструментов, а в трёх вещах:

**Первое — понимание trade-off'ов.** На любой вопрос «что лучше, X или Y» правильный ответ начинается со слов «зависит от…». Умение назвать, от чего именно зависит, — это и есть сеньорность.

**Второе — глубина в основе.** Человек, который по-настоящему понимает TCP, транзакции и консистентность, освоит любой новый брокер за неделю. Обратное не работает: знание десяти брокеров без фундамента бесполезно.

**Третье — то, что ты уже делаешь.** Собрать работающую систему руками, наступить на грабли, понять причину. Ты за этот курс уже прошёл dual write, ESM-резолвинг, платформозависимость `node_modules` и DNS внутри Docker-сети. Это опыт, который не выдаёт ни один учебник.

Не пытайся охватить всё сразу. Бери одну строку из таблицы, доводи до работающего состояния в своём проекте, разбирайся почему именно так — и переходи к следующей.
