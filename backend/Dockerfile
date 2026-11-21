FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma7.config.ts ./
USER node
EXPOSE 3000
# Ao subir: aplica as migrations pendentes, garante o primeiro administrador e liga a API.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/producao-inicial.ts && node dist/server.js"]
