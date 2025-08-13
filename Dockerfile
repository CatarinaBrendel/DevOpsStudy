# ---------- FRONTEND BUILD ----------
FROM node:20 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- BACKEND ----------
FROM node:20 AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy frontend build into backend's static/public folder
COPY --from=frontend /app/frontend/build ./public

# Create a volume mount point for SQLite DB (optional for Render)
VOLUME ["/data"]

# Expose backend port
EXPOSE 3001

CMD ["npm", "start"]
