# ---- How To Use ----
# How to use
# make up — start everything (or make up SERVICES=backend).
# make down — stop & remove containers (keeps volumes).
# make down-v — stop & remove volumes too (careful with DB data).
# make build — compose build + prune build cache older than CACHE_DAYS.
# make rebuild — no-cache rebuild, prune, then up.
# make redeploy — up -d --build (quick redeploy).
# make restart — restart running services.
# make logs SERVICES=backend — tail logs.

# ---- Config ----
CACHE_DAYS ?= 1          # prune build cache older than N days
SERVICES ?=              # e.g., SERVICES="backend frontend"
PROFILES ?=              # e.g., PROFILES="dev"

# Compose command (override if needed)
COMPOSE = docker compose $(foreach p,$(PROFILES),--profile $(p))

# ---- Lifecycle ----
up:
	$(COMPOSE) up -d $(SERVICES)

down:
	# Safe down: keeps volumes
	$(COMPOSE) down --remove-orphans

down-v:
	# DANGER: also removes named volumes
	$(COMPOSE) down --volumes --remove-orphans

restart:
	$(COMPOSE) restart $(SERVICES)

redeploy:
	# Rebuild and start (keeps existing volumes)
	$(COMPOSE) up -d --build $(SERVICES)

rebuild:
	# Clean rebuild (no cache) + prune old build cache
	$(COMPOSE) build --no-cache $(SERVICES)
	docker builder prune -f --filter until=$(CACHE_DAYS)d
	$(COMPOSE) up -d $(SERVICES)

build:
	$(COMPOSE) build $(SERVICES)
	docker builder prune -f --filter until=$(CACHE_DAYS)d

deploy:
	docker compose down && docker compose build --no-cache && docker compose up

# --- Frontend shortcuts ---
front:
	$(COMPOSE) up -d frontend

front-build:           # rebuild just FE image & restart that container
	$(COMPOSE) up -d --no-deps --build frontend

front-restart:
	$(COMPOSE) restart frontend

front-logs:
	$(COMPOSE) logs -f --tail=200 frontend

front-watch:           # if your Docker supports compose watch
	$(COMPOSE) watch frontend


# ---- Inspect / Logs ----
ps:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f --tail=200 $(SERVICES)

# ---- Cleanup (safe) ----
clean:
	docker container prune -f
	docker image prune -f
	docker builder prune -f --filter until=$(CACHE_DAYS)d
