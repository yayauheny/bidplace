.DEFAULT_GOAL := help
.NOTPARALLEL:
.PHONY: help doctor install dev dev-api dev-web dev-infra build build-web rebuild generate db-migrate check test clean

help: ## Show developer commands
	@awk 'BEGIN { FS = ":.*## " } /^[a-z-]+:.*## / { printf "  make %-12s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

doctor: ## Check toolchain and configuration presence without reading env contents
	node scripts/doctor.mjs

install: ## Install locked dependencies and generate Prisma client
	pnpm install --frozen-lockfile
	$(MAKE) generate

dev: ## Start local PostgreSQL, apply migrations and run API + Expo
	$(MAKE) dev-infra
	$(MAKE) generate
	$(MAKE) db-migrate
	pnpm dev

dev-api: ## Run NestJS with its workspace dependencies
	pnpm exec turbo run dev --filter=@bidplace/api

dev-web: ## Run Expo web with shared packages and tokens
	pnpm --filter @bidplace/mobile web

dev-infra: ## Start local PostgreSQL and wait until healthy
	pnpm docker:up

build: ## Build the complete workspace through Turbo
	pnpm build

build-web: ## Export production web and build its dependencies
	pnpm exec turbo run build:web --filter=@bidplace/mobile

rebuild: ## Clean artifacts, install, generate and build in order
	$(MAKE) clean
	$(MAKE) install
	$(MAKE) build

generate: ## Run workspace code generation
	pnpm exec turbo run generate

db-migrate: ## Apply reviewed Prisma migrations to the configured database
	pnpm db:migrate

check: ## Check types, lint and formatting without changing files
	pnpm typecheck
	pnpm lint
	pnpm format:check

test: ## Run unit and operational script tests
	pnpm test:unit
	pnpm test:ops

clean: ## Remove build, generated and cache artifacts; keep dependencies/data
	rm -rf apps/*/dist packages/*/dist apps/mobile/.expo apps/mobile/expo-env.d.ts .turbo apps/*/.turbo packages/*/.turbo packages/database/src/generated/prisma
