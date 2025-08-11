# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Use docker cache
COPY package*.json ./
# If you have a lockfile (recommended), COPY it too (package-lock.json / yarn.lock / pnpm-lock.yaml)
RUN npm ci

# Now copy the rest
COPY . .

# Build your app
# For CRA:
RUN npm run build
# For Vite (uncomment instead):
# RUN npm run build && ls -la dist

# ---- runtime stage ----
FROM nginx:alpine

# Optional: drop in an nginx.conf with SPA fallback & basic compression
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# CRA output:
COPY --from=builder /app/build /usr/share/nginx/html
# Vite output (use this instead of the line above):
# COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
