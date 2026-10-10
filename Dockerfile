# Single-container deploy (Railway, Render, any Docker host): API on 127.0.0.1:4000, website on $PORT.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY backend/package*.json backend/
COPY frontend/package*.json frontend/
RUN npm --prefix backend ci --omit=dev && npm --prefix frontend ci
COPY backend backend
COPY frontend frontend
RUN npm --prefix frontend run build && npm --prefix frontend prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/backend backend
COPY --from=build /app/frontend frontend
COPY scripts/start-prod.mjs scripts/start-prod.mjs
# Mount a persistent volume here so the SQLite database survives redeploys.
ENV DB_PATH=/data/weddings.db
EXPOSE 3000
CMD ["node", "scripts/start-prod.mjs"]
