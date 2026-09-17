# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Сначала только манифесты — чтобы Docker кэшировал установку,
# пока package.json не меняется (слой не пересобирается).
COPY package*.json ./
RUN npm install

# Теперь код и сборка
COPY . .
RUN npm run build

# ---------- production stage ----------
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Только прод-зависимости (без nest cli, vitest и пр.)
COPY package*.json ./
RUN npm install --omit=dev

# Готовый JS из build-стадии
COPY --from=build /app/dist ./dist

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main"]
