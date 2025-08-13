# ===== FRONTEND BUILD STAGE =====
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ===== BACKEND STAGE =====
FROM node:22-bookworm-slim
WORKDIR /app

# Copy backend package files & install deps
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend/ ./

# Copy frontend build into backend public folder
COPY --from=frontend-builder /app/frontend/build ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "index.js"]
