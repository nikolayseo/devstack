# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Сначала только манифесты — чтобы Docker кэшировал npm ci,
# пока package.json не меняется (слой не пересобирается).
COPY package*.json ./
RUN npm ci

# Теперь код и сборка
COPY . .
RUN npm run build

# ---------- production stage ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Только прод-зависимости (без nest cli, vitest и пр.)
COPY package*.json ./
RUN npm ci --omit=dev

# Готовый JS из build-стадии
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
