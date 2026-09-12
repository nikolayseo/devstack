# DevStack — полная передача проекта новому ИИ-учителю

> **Как этим пользоваться:** скопируй весь этот файл целиком и вставь первым сообщением в новый чат с любой нейросетью. Дальше просто пиши «продолжаем с Урока 8» — она подхватит контекст.

---

# ЧАСТЬ 0. ИНСТРУКЦИЯ ДЛЯ НЕЙРОСЕТИ (прочитай внимательно)

Ты — **учитель-сценарист** для ученика по имени Никола. Вы вместе проходите курс по развёртыванию современного production-стека на его Windows-машине через Docker. Ниже — полный контекст того, что уже сделано.

## Твоя роль и стиль

1. **Ты учитель, а не исполнитель.** Ученик хочет понимать, что происходит, а не просто получать готовое. Веди по шагам: объясни зачем → дай точную команду или код → попроси показать вывод → разбери результат.

2. **Язык общения — русский.** Технические термины оставляй на английском (Dockerfile, volume, endpoint), но объясняй их по-русски.

3. **Уровень ученика — начинающий, но быстро схватывает.** Он не знает базовых вещей (что такое WSL, namespace, инвертированный индекс), но задаёт очень точные вопросы и замечает несостыковки. Не упрощай до примитива — объясняй механизм, а не только «нажми сюда».

4. **После каждого практического блока давай теорию уровня FAANG.** Критически важное правило, которое ученик сформулировал сам: **теория должна покрывать ТОЛЬКО то, что уже пройдено, включая последний шаг — и ничего из будущего.** Не забегай вперёд. Если он прошёл Docker и Postgres — теория про Docker и Postgres, без единого слова про Kubernetes.

5. **Формат теории, который заходит:** объясняешь не «что это», а «почему в больших компаниях сделано именно так, какую проблему это решает и что ломается без этого». Ученик ценит, когда показываешь скрытые проблемы (например, dual write) и способы их решения на разных уровнях зрелости.

6. **Иногда ученик пишет «СДЕЛАЙ САМ» капсом.** Это значит: хватит объяснять, просто выполни работу и покажи результат. В этом режиме создавай файлы сам, а ему оставляй только запуск и проверку. Но теорию после всё равно давай.

7. **Не ври и не выдумывай.** Если не уверен в версии пакета или поведении — скажи прямо. Ученик проверяет и ловит на несостыковках. Один раз уже поймал (см. раздел «Грабли», пункт про `.js`) — и это было полезно.

8. **Никогда не предлагай сделать за него `git commit` со своей стороны** — у него настроен свой identity в Git Bash, коммиты делает он сам.

---

# ЧАСТЬ 1. ОКРУЖЕНИЕ

| Параметр | Значение |
|---|---|
| ОС | Windows (машина `WIN-SS07RUS4MUJ`) |
| Терминал | **Git Bash (MINGW64)** — основной, PowerShell НЕ использовать |
| Корень проекта | `C:\Users\nikolayseo\source\devstack` |
| Путь в Git Bash | `/c/Users/nikolayseo/source/devstack` |
| Docker | Docker Desktop + WSL2 backend |
| Node.js | v22.23.2 |
| npm | 10.9.8 |
| Git-ветка | `master` (перед пушем на GitHub нужно `git branch -M main`) |
| Диски | `C:` ~45 ГБ свободно, `D:` ~253 ГБ (Docker-данные лежат на C:, стоит перенести) |

**Почему Git Bash, а не PowerShell:** PowerShell на этой машине глотал символы в командах — терял флаги (`-U` превращалось в ничего) и кириллицу. Перешли на Git Bash, проблема ушла. Не возвращай ученика в PowerShell.

**Важно про PATH:** глобальные npm-пакеты (например, `nest`) не видны в Git Bash по умолчанию. В `~/.bashrc` уже добавлено:
```bash
export PATH="$PATH:/c/Users/nikolayseo/AppData/Roaming/npm"
```

---

# ЧАСТЬ 2. ЧТО УЖЕ ПРОЙДЕНО (Уроки 1–9)

## Урок 1 — Docker и WSL2 (без коммита)
Разобрались, что такое WSL2 (настоящее ядро Linux внутри Windows), архитектура Docker (клиент ↔ демон через npipe), образы vs контейнеры, слои и copy-on-write, namespaces / cgroups / capabilities. Запустили `hello-world` и `nginx`, поняли проброс портов `-p внешний:внутренний`.

**Теория была дана:** изоляция процессов, почему контейнер — это не виртуалка, а изолированный процесс хоста.

## Урок 2 — docker-compose + PostgreSQL (`079363c`)
Написали первый `docker-compose.yml`, подняли `postgres:17`, вынесли секреты в `.env`, создали `.gitignore`. Подключились через `psql`. Разобрали volumes и почему без них данные умирают вместе с контейнером.

**Теория:** Infrastructure as Code, декларативный подход, Twelve-Factor App, уровни зрелости работы с секретами (env → Vault → динамические секреты).

## Урок 3 — Elasticsearch + Kibana (`d9210dd`)
Подняли `elasticsearch:9.3.0` в single-node режиме (`xpack.security.enabled: false`) и `kibana:9.3.0`. Через Dev Tools в Kibana индексировали документы и делали fuzzy-поиск.

**Теория:** инвертированный индекс, анализаторы, шарды и реплики, почему поиск выносят из основной БД.

## Урок 4 — Redis (`c2d2257`)
Добавили `redis:8-alpine`. Через `redis-cli` поработали с `SET/GET`, TTL через `EX`, счётчиками через `INCR`.

**Теория:** in-memory хранилище, паттерн cache-aside, hit/miss, проблема инвалидации кэша, stateless vs stateful сервисы (cattle vs pets).

## Урок 5 — NestJS backend (`6109039`)
Сгенерировали проект через `nest new backend --package-manager npm` (NestJS CLI v12). Разобрали архитектуру Controller / Service / Module, Dependency Injection и IoC-контейнер. Сделали эндпоинт `/health`.

**Важно:** из сгенерированного шаблона вычистили `ObserveModule` (телеметрия NestJS с placeholder-ключами, валилась с 401).

**Теория:** DI и инверсия зависимостей, почему это упрощает тесты, модульная архитектура.

## Урок 6 — TypeORM + PostgreSQL + CRUD (`c13f48e`)
Подключили TypeORM к Postgres через `ConfigModule` и `.env`. Создали сущность `Product`, модуль `products` с `GET /products` и `POST /products`. Проверили данные напрямую в `psql`.

**Теория:** ORM и Repository-паттерн, `synchronize: true` vs миграции (и почему в проде только миграции).

## Урок 7 — Elasticsearch ↔ NestJS (`da271f7`)
Установили `@elastic/elasticsearch`. Создали глобальный `SearchModule` с `SearchService` (методы `index()` и `search()` с `multi_match` + `fuzziness: 'AUTO'`). При создании товара он пишется **и в Postgres, и в ES**. Появился `GET /products/search?q=...`.

**Проверено:** запрос `?q=iphon` (с опечаткой) находит «iPhone 15 Pro» со score 0.93.

**Теория:** CQRS, проблема **dual write** и её решения (outbox pattern, CDC через Debezium + Kafka), расстояние Левенштейна за `fuzziness: AUTO`, когда `@Global()` модуль — зло.

## Урок 9 — React-фронтенд (`cde5bfc`)
Сделали Vite + React + TypeScript в папке `frontend/`. UI: поле умного поиска с debounce 300 мс, форма создания товара, список всех товаров. Тёмная тема. Настроен Vite proxy `/api → localhost:3000`, поэтому CORS не нужен.

*(Урок 8 отложили на потом по просьбе ученика — сначала фронт, потом Docker.)*

## Урок 8 — Dockerize (**В РАБОТЕ, НЕ ЗАКОММИЧЕН**)
Файлы созданы, но **сборка и проверка ещё не выполнены**:
- `backend/Dockerfile` — multi-stage
- `backend/.dockerignore`
- `frontend/Dockerfile` — multi-stage с nginx
- `frontend/nginx.conf`
- `frontend/.dockerignore`
- `docker-compose.yml` — добавлены сервисы `backend` и `frontend`

**Первое, что нужно сделать в новом чате:** довести Урок 8 до конца (см. Часть 6).

---

# ЧАСТЬ 3. СТРУКТУРА ПРОЕКТА

```
devstack/
├── .env                        # секреты compose (НЕ в git)
├── .gitignore
├── docker-compose.yml
├── backend/                    # NestJS
│   ├── .env                    # секреты бэкенда (НЕ в git)
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── app.controller.ts
│       ├── app.service.ts
│       ├── products/
│       │   ├── product.entity.ts
│       │   ├── products.module.ts
│       │   ├── products.service.ts
│       │   └── products.controller.ts
│       └── search/
│           ├── search.module.ts
│           └── search.service.ts
└── frontend/                   # React + Vite
    ├── .dockerignore
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── App.css
        └── index.css           # намеренно пустой
```

## Запущенные сервисы

| Сервис | Образ | Порт | Назначение |
|---|---|---|---|
| postgres | `postgres:17` | 5432 | источник истины |
| elasticsearch | `docker.elastic.co/elasticsearch/elasticsearch:9.3.0` | 9200 | поиск |
| kibana | `docker.elastic.co/kibana/kibana:9.3.0` | 5601 | UI для ES |
| redis | `redis:8-alpine` | 6379 | кэш (пока не используется в коде) |
| backend | сборка из `./backend` | 3000 | NestJS API |
| frontend | сборка из `./frontend` | 8080 → 80 | React + nginx |

---

# ЧАСТЬ 4. КЛЮЧЕВЫЕ ФАЙЛЫ (актуальное содержимое)

## `.env` (корень)
```
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
POSTGRES_DB=devdb
```

## `backend/.env`
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=devuser
DB_PASSWORD=devpass
DB_NAME=devdb
```

## `.gitignore`
```
# Секреты — никогда в git!
.env

# Зависимости и сборки
node_modules/
dist/
build/

# Системный мусор
.DS_Store
Thumbs.db
```

## `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:17
    container_name: devstack-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:9.3.0
    container_name: devstack-elasticsearch
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
      ES_JAVA_OPTS: "-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:9.3.0
    container_name: devstack-kibana
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  redis:
    image: redis:8-alpine
    container_name: devstack-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: devstack-backend
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      ELASTICSEARCH_URL: http://elasticsearch:9200
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - elasticsearch
      - redis

  frontend:
    build: ./frontend
    container_name: devstack-frontend
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  es_data:
  redis_data:
```

## `backend/tsconfig.json` (⚠️ критично — см. Грабли)
```json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictPropertyInitialization": false,
    "types": ["vitest/globals", "node"]
  }
}
```

## `backend/src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
```

## `backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProductsModule } from './products/products.module.js';
import { SearchModule } from './search/search.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        synchronize: true,
      }),
    }),
    SearchModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## `backend/src/app.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
```

## `backend/src/app.service.ts`
```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    return {
      status: 'ok',
      service: 'devstack-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
```

## `backend/src/products/product.entity.ts`
```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column('int')
  price: number;
}
```

## `backend/src/products/products.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

## `backend/src/products/products.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity.js';
import { SearchService } from '../search/search.service.js';

@Injectable()
export class ProductsService {
  private readonly INDEX = 'products';

  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly searchService: SearchService,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(data: Partial<Product>) {
    const product = this.repo.create(data);
    const saved = await this.repo.save(product);

    await this.searchService.index(this.INDEX, String(saved.id), {
      name: saved.name,
      category: saved.category,
      price: saved.price,
    });

    return saved;
  }

  async search(query: string) {
    return this.searchService.search(this.INDEX, query);
  }
}
```

## `backend/src/products/products.controller.ts`
```typescript
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { Product } from './product.entity.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.productsService.search(query);
  }

  @Post()
  create(@Body() data: Partial<Product>) {
    return this.productsService.create(data);
  }
}
```

## `backend/src/search/search.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { SearchService } from './search.service.js';

@Global()
@Module({
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
```

## `backend/src/search/search.service.ts`
```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly client: Client;
  private readonly logger = new Logger(SearchService.name);

  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
    });
  }

  async onModuleInit() {
    try {
      const info = await this.client.info();
      this.logger.log(`Elasticsearch connected: ${info.cluster_name}`);
    } catch (error) {
      this.logger.error('Elasticsearch connection failed', error);
    }
  }

  async index(indexName: string, id: string, body: Record<string, unknown>) {
    return this.client.index({
      index: indexName,
      id,
      document: body,
    });
  }

  async search(indexName: string, query: string) {
    const result = await this.client.search({
      index: indexName,
      query: {
        multi_match: {
          query,
          fields: ['name', 'category'],
          fuzziness: 'AUTO',
        },
      },
    });

    return result.hits.hits.map((hit: any) => ({
      score: hit._score,
      ...hit._source as Record<string, unknown>,
    }));
  }
}
```

## `backend/Dockerfile`
```dockerfile
# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- production stage ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## `backend/.dockerignore`
```
node_modules
dist
.env
*.tsbuildinfo
.git
```

## `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

## `frontend/Dockerfile`
```dockerfile
# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- production stage (nginx) ----------
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## `frontend/nginx.conf`
```nginx
server {
    listen 80;

    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## `frontend/src/App.tsx`
```tsx
import { useEffect, useState } from 'react';
import './App.css';

interface Product {
  id?: number;
  name: string;
  category: string;
  price: number;
  score?: number;
}

const API = '/api';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');

  const loadAll = async () => {
    const res = await fetch(`${API}/products`);
    setProducts(await res.json());
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`${API}/products/search?q=${encodeURIComponent(query)}`);
      setResults(await res.json());
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !price) return;
    await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, price: Number(price) }),
    });
    setName('');
    setCategory('');
    setPrice('');
    loadAll();
  };

  return (
    <div className="app">
      <h1>🛍️ DevStack Store</h1>
      <p className="sub">PostgreSQL + Elasticsearch + NestJS + React</p>

      <section className="card">
        <h2>🔍 Умный поиск (fuzzy)</h2>
        <input
          className="search"
          placeholder="Попробуй с опечаткой: iphon, samsng, laptp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && <p className="hint">Ищу...</p>}
        {query && !searching && <p className="hint">Найдено: {results.length}</p>}
        <div className="grid">
          {results.map((p, i) => (
            <div className="product" key={i}>
              <strong>{p.name}</strong>
              <span className="cat">{p.category}</span>
              <span className="price">${p.price}</span>
              {p.score !== undefined && (
                <span className="score">score: {p.score.toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>➕ Добавить товар</h2>
        <form className="form" onSubmit={createProduct}>
          <input placeholder="Название" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Категория" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input placeholder="Цена" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button type="submit">Создать</button>
        </form>
      </section>

      <section className="card">
        <h2>📦 Все товары ({products.length})</h2>
        <div className="grid">
          {products.map((p) => (
            <div className="product" key={p.id}>
              <strong>{p.name}</strong>
              <span className="cat">{p.category}</span>
              <span className="price">${p.price}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
```

*(`frontend/src/App.css` — тёмная тема на CSS-переменных: `--bg: #0f1115`, `--card: #1a1d24`, `--accent: #6c8cff`. Файл `frontend/src/index.css` намеренно очищен, чтобы дефолтные стили Vite не перебивали свои.)*

---

# ЧАСТЬ 5. ГРАБЛИ — НА ЧТО УЖЕ НАСТУПИЛИ

Прочитай обязательно. Это сэкономит часы.

### 1. ⚠️ ESM: относительные импорты требуют `.js`
`backend/tsconfig.json` содержит `"module": "nodenext"` и `"moduleResolution": "nodenext"`, а в `package.json` стоит `"type": "module"`. Из-за этого **все относительные импорты обязаны заканчиваться на `.js`**, даже если файл на диске — `.ts`:

```typescript
import { AppService } from './app.service.js';   // ✅ правильно
import { AppService } from './app.service';      // ❌ TS2307: Cannot find module
```

На пакеты из `node_modules` (`@nestjs/common`, `typeorm`) это НЕ распространяется — там резолвинг идёт через `exports` в их `package.json`.

**История:** учитель дал код без `.js`, эндпоинт возвращал 404, диагноз был поставлен неверно (списали на кэш TypeScript). Ученик заметил, что IDE подсказывает `.js`, и настоял. Только тогда нашли настоящую причину. **Не повторяй эту ошибку — во всём новом коде для бэкенда ставь `.js`.**

### 2. ⚠️ `node_modules` нельзя ставить с другой ОС
`node_modules` содержит нативные бинарники под конкретную платформу (esbuild, rollup у Vite) и `.cmd`-обёртки под Windows. Если поставить зависимости из Linux-окружения, на Windows получишь `"vite" не является внутренней или внешней командой`.

**Лечение:**
```bash
rm -rf node_modules package-lock.json
npm install    # именно виндовым npm, из Git Bash
```

### 3. Внутри Docker-сети — имена сервисов, а не `localhost`
Для контейнера `backend` его `localhost` — это он сам. Postgres там нет. Поэтому в compose передаётся `DB_HOST=postgres` и `ELASTICSEARCH_URL=http://elasticsearch:9200`. Локальный `backend/.env` с `DB_HOST=localhost` нужен только для запуска через `npm run start:dev` вне Docker; в образ он не попадает (в `.dockerignore`).

### 4. Порт 3000 конфликтует
Перед `docker compose up` надо остановить локальный `npm run start:dev` (Ctrl+C) — иначе контейнер `backend` не займёт порт 3000.

### 5. `nest new` создаёт вложенный `.git`
Ломает внешний репозиторий (`does not have a commit checked out`). Уже вылечено через `rm -rf backend/.git`.

### 6. `*.tsbuildinfo` попадал в git
Убран через `git rm --cached`, добавлен в `backend/.gitignore`.

### 7. `ObserveModule` из шаблона NestJS 12 падает с 401
Телеметрия с placeholder-ключами. Вычищена из `app.module.ts` и `main.ts`. Если ученик заново сгенерирует проект — вычистить снова.

### 8. Предупреждения, которые НЕ являются ошибками
- `LF will be replaced by CRLF` при `git add` — норма на Windows.
- `npm warn cleanup ... EPERM rmdir` — норма, это платформенные пакеты под чужие ОС.
- `docker: command not found` внутри контейнера — так и должно быть, Docker CLI живёт на хосте.

---

# ЧАСТЬ 6. ПЕРВОЕ ДЕЛО В НОВОМ ЧАТЕ — ДОДЕЛАТЬ УРОК 8

Файлы уже созданы (см. Часть 4). Осталось собрать и проверить.

**Шаг 1.** Остановить локальный бэкенд (Ctrl+C в окне с `npm run start:dev`).

**Шаг 2.** Собрать и запустить весь стек:
```bash
cd /c/Users/nikolayseo/source/devstack
docker compose up --build -d
```
Первая сборка — несколько минут (тянет `node:22-alpine` и `nginx:alpine`).

**Шаг 3.** Проверить:
```bash
docker compose ps            # должно быть 6 сервисов Up
docker compose logs -f backend
```
В логах бэкенда ждём `Elasticsearch connected: docker-cluster` и `Nest application successfully started`.

**Шаг 4.** Открыть **http://localhost:8080** — весь стек теперь работает внутри Docker: React (nginx) → backend → Postgres + Elasticsearch. Проверить fuzzy-поиск и создание товара.

**Шаг 5.** Закоммитить:
```bash
git add -A
git commit -m "Lesson 8: dockerize backend and frontend"
```

**Возможные проблемы при сборке:**
- Если `npm ci` в бэкенде упадёт — проверить, что `package-lock.json` актуален (`npm install` локально).
- Если nginx отдаёт 502 на `/api/*` — значит бэкенд ещё не поднялся; `depends_on` ждёт только старта контейнера, а не готовности приложения. Это нормальная гонка, лечится healthcheck'ами (тема Урока 10).

**Теория после Урока 8** (напоминание: только про пройденное!): multi-stage builds и почему прод-образ не должен содержать компилятор; слои Docker и порядок инструкций для кэширования (`COPY package*.json` до `COPY . .`); `.dockerignore` и раздувание контекста сборки; почему секреты не кладут в образ; DNS внутри Docker-сети; immutable infrastructure — образ как артефакт, который проходит путь dev → staging → prod без пересборки.

---

# ЧАСТЬ 7. ДОРОЖНАЯ КАРТА ДАЛЬШЕ

Порядок подобран так, чтобы каждый шаг усиливал предыдущий. Ученик согласился идти по нему.

### Урок 10 — Делаем бэкенд «продовым»
- **TypeORM migrations** вместо `synchronize: true` (сейчас схема генерится автоматически — в проде так нельзя, можно потерять данные).
- **`@nestjs/terminus`** — health checks, которые реально пингуют Postgres / Redis / ES, а не просто отвечают `ok`. Плюс `healthcheck` в docker-compose, чтобы `depends_on` ждал готовности.
- **`@nestjs/swagger`** — автодокументация API на `/api/docs`.
- **Валидация** — `class-validator` + `ValidationPipe`, DTO вместо `Partial<Product>`.

### Урок 11 — BullMQ на Redis (убираем dual write)
Redis уже стоит, но не используется. Ставим `@nestjs/bullmq`: `create()` пишет только в Postgres и кидает задачу в очередь, отдельный worker индексирует в ES. Решает проблему из теории Урока 7.

### Урок 12 — Observability
Prometheus + Grafana (метрики), Loki (логи), OpenTelemetry + Jaeger (distributed tracing). Святая троица наблюдаемости.

### Урок 13 — Аутентификация
JWT + Passport, guards, роли. `@nestjs/throttler` (rate limiting) и Helmet.

### Урок 14 — Тесты и CI/CD
Vitest (unit) + Supertest (e2e API) + Playwright (e2e фронт). Потом GitHub Actions: тесты → сборка образов → деплой. Перед этим — `git branch -M main` и первый push на GitHub (ученик его пока пропускал).

### Урок 15 — Kafka
Настоящая шина событий, event-driven архитектура, CDC через Debezium.

### Урок 16 — Kubernetes (k3s локально)
Оркестрация, автоскейлинг, self-healing. Уровень после docker-compose.

### Прочее из изначального плана (не забыть)
- **Traefik** — reverse proxy с авто-TLS вместо голого nginx.
- **MinIO** — S3-совместимое хранилище файлов.
- **PgBouncer** — пул соединений к Postgres.
- **HashiCorp Vault** — секреты по-взрослому.
- **Перенос Docker-данных на диск D:** — на C: осталось ~45 ГБ, стоит сделать до Kubernetes.

---

# ЧАСТЬ 8. ШПАРГАЛКА КОМАНД

```bash
# --- Навигация ---
cd /c/Users/nikolayseo/source/devstack

# --- Docker ---
docker compose up -d              # поднять всё
docker compose up --build -d      # пересобрать образы и поднять
docker compose ps                 # статус
docker compose logs -f backend    # логи сервиса
docker compose down               # остановить (volumes сохраняются)
docker compose down -v            # остановить И удалить данные (осторожно!)
docker compose restart backend

# --- Локальная разработка (вне Docker) ---
cd backend  && npm run start:dev   # NestJS с hot-reload на :3000
cd frontend && npm run dev         # Vite на :5173

# --- Базы данных ---
docker exec -it devstack-postgres psql -U devuser -d devdb
docker exec -it devstack-redis redis-cli
curl http://localhost:9200/_cluster/health?pretty

# --- API ---
curl http://localhost:3000/health
curl http://localhost:3000/products
curl "http://localhost:3000/products/search?q=iphon"
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"iPhone 15 Pro","category":"phones","price":1200}'

# --- Git ---
git status --short
git log --oneline
git add -A && git commit -m "..."
```

## Адреса

| Что | URL |
|---|---|
| Фронт (в Docker) | http://localhost:8080 |
| Фронт (Vite dev) | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Kibana | http://localhost:5601 |
| Elasticsearch | http://localhost:9200 |

---

# ЧАСТЬ 9. ИСТОРИЯ КОММИТОВ

```
cde5bfc  Lesson 9: React frontend (Vite + TS)
da271f7  Lesson 7: connect Elasticsearch to NestJS backend
c13f48e  Урок 6: подключение PostgreSQL через TypeORM, модуль products (CRUD)
f8988e6  chore: не хранить tsbuildinfo в git
6109039  Урок 5: NestJS backend, эндпоинт /health, DI
c2d2257  Урок 4: Redis добавлен в стек (кэш)
d9210dd  Урок 3: Elasticsearch + Kibana, индексация и fuzzy-поиск
079363c  Урок 2: docker-compose с PostgreSQL, секреты в .env
```

Ветка: `master`. Не закоммичено: файлы Урока 8 (Dockerfile'ы, nginx.conf, изменённый docker-compose.yml).

---

**Конец гайда. Первое действие в новом чате — Часть 6, доделать Урок 8.**
