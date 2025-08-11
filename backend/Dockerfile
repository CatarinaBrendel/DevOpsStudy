# backend/Dockerfile
FROM node:22-bookworm-slim

# Native build deps for sqlite3 (node-gyp)
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps
COPY package*.json ./
# Prefer lockfile if you have it
RUN npm ci --include=dev

# App source
COPY . .

# Production: drop dev deps after native builds done
ENV NODE_ENV=production
RUN npm prune --omit=dev

# Non-root user + caches
RUN useradd -m app \
 && mkdir -p /home/app/.cache /home/app/.npm /data \
 && chown -R app:app /app /home/app /data
USER app

# If your server listens on 3001:
EXPOSE 3001
CMD ["node", "index.js"]
