# AGENTS.md

## Repo Shape
- This is a two-project repo (no root workspace runner): work inside `backend/` or `frontend/` explicitly.
- Backend entrypoints: `backend/src/app.ts` (Express app) and `backend/src/index.ts` (startup + DB + role/permission sync).
- Frontend entrypoint: `frontend/app/` (Next app router).

## Commands That Matter
- Backend dev/build/test: `cd backend && npm run dev|build|test`.
- Backend focused test: `cd backend && npm test -- src/features/<feature>/<file>.test.ts`.
- Frontend dev/build/lint: `cd frontend && npm run dev|build|lint`.
- Frontend `npm test` is a placeholder (always exits success); do not treat it as real coverage.

## Prisma and Schema Rules (Critical)
- `backend/prisma/schema.prisma` is generated; do not edit manually.
- Edit models in `backend/prisma/models/**/*.prisma`.
- Required order after model changes: `cd backend && npm run prisma:merge && npm run prisma:generate` (or `npm run prisma:migrate` when changing DB).
- Prisma runtime requires `DATABASE_URL`; Prisma config/migrations use `DIRECT_URL` (`backend/prisma.config.ts`).

## Backend Conventions Easy to Break
- Backend is ESM (`"type": "module"`): TS imports must include `.js` in local import paths.
- Multi-tenant module routes (`/api/inventory`, `/api/sales`, `/api/crm`, `/api/workshop`) require both:
  - `Authorization: Bearer <token>`
  - `X-Empresa-Id: <empresaId>`
- Route wiring source of truth: `backend/src/routes/api.routes.ts`.

## Frontend/API Integration Gotchas
- API base URL defaults to production if `NEXT_PUBLIC_API_BASE_URL` is unset (`frontend/app/api/apiClient.ts`).
- API client auto-injects `Authorization` and `X-Empresa-Id` from session/store.
- `frontend/next.config.js` sets `typescript.ignoreBuildErrors = true`; `npm run build` can pass with TS errors.

## Verification Strategy
- Backend changes: `npm run build` + targeted `npm test -- <file>`.
- Prisma/model changes: run Prisma merge/generate before build/tests.
- Frontend changes: `npm run lint && npm run build`; for strict type verification also run `npx tsc --noEmit`.

## Testing Reality
- Backend tests use Prisma directly and expect DB/env configured.
- Test auth/company fixtures come from `backend/src/shared/utils/test.utils.ts` (creates `admin@test.com`, empresa, membership).

## CI/Deploy Notes
- Only CI workflow present: `.github/workflows/deploy.yml` (build/push Docker images on push to `main`).
- It is deployment-focused, not a full quality gate; run local verification yourself.

## Keep in Sync
- `CLAUDE.md` contains active repo conventions (feature structure, validation style, frontend patterns). Keep both files aligned when conventions change.
