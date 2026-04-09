# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AutoSys** is a workshop management system with a monorepo structure:
- **Backend**: Express.js (ES modules, not NestJS) — `backend/` directory
- **Frontend**: Next.js 14 with PrimeReact components — `frontend/` directory  
- **Database**: PostgreSQL + Prisma ORM with multi-model schema structure

## Quick Start Commands

### Backend
```bash
cd backend
npm run dev              # Start dev server (tsx watch)
npm run build           # TypeScript compilation
npm run prisma:merge    # Merge model files into schema.prisma
npm run prisma:migrate  # Merge + run Prisma migrations
npm run seed            # Run prisma/seeds/
npm test                # Run Jest tests
```

### Frontend
```bash
cd frontend
npm run dev             # Start Next.js dev server (port 3000)
npm run build           # Build production bundle
npm run lint            # ESLint check
npm run format          # Prettier format
npm test                # No tests configured
```

## Architecture & Patterns

### Backend (Express)

**Folder Structure**: Feature-based organization
```
src/features/<feature>/<submodule>/
  ├── <name>.routes.ts       # Router with endpoints
  ├── <name>.controller.ts    # Request handlers (asyncHandler wrapper)
  ├── <name>.service.ts       # Business logic (class singleton)
  ├── <name>.dto.ts           # Data transfer objects (constructor pattern)
  ├── <name>.validation.ts    # Joi schemas with Spanish messages
  ├── <name>.interface.ts     # TypeScript interfaces
```

**Key Patterns**:
- **Services**: Class singleton accepting `db: PrismaClientType`, cast to `(db as PrismaClient)`. Always filter by `empresaId`.
- **Controllers**: Wrapped with `asyncHandler`, use `req.empresaId`, `req.prisma`, return `ApiResponse.success/created/paginated()`.
- **DTOs**: Constructor accepts `unknown`, use `asRecord()` helper to safely cast.
- **Validation**: Joi with Spanish messages, call `validateRequest(schema, 'body'|'query'|'params')`.
- **Errors**: Throw `NotFoundError` | `ConflictError` | `BadRequestError` from `shared/utils/apiError.js`.
- **Auth**: Token via `X-Empresa-Id` header, validated by `authorize(PERMISSIONS.*)` middleware.
- **Imports**: Must include `.js` extension (ES modules).

**Prisma Notes**:
- `schema.prisma` is AUTO-GENERATED — edit `prisma/models/**/*.prisma` instead.
- Primary key: `id_empresa` (not `id`) — relation: `{ connect: { id_empresa: empresaId } }`.
- IDs use `cuid()` format, not UUID.
- Enums: do NOT use `@@map` inside enum blocks.
- Migration: `npm run prisma:migrate` (merges + runs).

### Frontend (Next.js)

**File Organization**:
- `libs/interfaces/<module>/` — one file per entity (never dump all types into `index.ts`)
- `libs/zods/<module>/` — Zod validation schemas per entity
- `app/api/<module>/` — API client services (singleton pattern)
- `components/<module>/` — UI components organized by feature

**Key Patterns**:
- **List Components** (`ItemList.tsx`): DataTable with lazy pagination, Menu (cog icon) for row actions, DeleteConfirmDialog for destructive ops.
- **Form Components** (`ItemForm.tsx`): React Hook Form with `mode: "onBlur"`, no cancel button (handled by Dialog parent), error handling via `handleFormError()` (not toast in form).
- **Dialog Patterns**:
  - Header: JSX with icon + `border-bottom-2 border-primary pb-2` separator (not plain strings)
  - Footer: `<FormActionButtons>` component for standardized buttons
  - Action buttons: `flex w-full gap-2` wrapper, `flex-1` for buttons, `icon="pi pi-times"` for cancel, `icon="pi pi-check"` for submit
- **Toast Success**: Shown in List parent's `onSave()` callback, NOT in Form.
- **onSave Signature**: `onSave: () => void | Promise<void>` to support async operations.

**Component Patterns** (from `contexto_refactorizacion_list_y_form.md`):
- Use `CreateButton` component instead of primitive `<Button>` for "Nuevo..." buttons.
- Status/state transitions: Column "Proceso" with contextual buttons (edit/pause/start/etc), separate from "Acciones" menu.
- Filter parameters: Pass `isActive` as **string** `"true"` | `"false"`, not boolean.

## Data Access

**Prisma IDs**: System uses `cuid()` format (e.g., `clxxxxxxx...`), NOT UUID.
- Zod validation: remove `.uuid()` calls, use plain `.string()` for ID fields.

**R2 Storage** (Cloudflare):
- Service: `r2StorageService.uploadFile(buffer, key, mimetype)` returns URL.
- Middleware: `FileUploadHelper.createMemoryUploader('fieldName')` for file uploads.
- Routes: Static routes must come BEFORE `/:id` to avoid conflicts.

## Important Notes

- **Linting**: Pre-commit hooks may auto-format or validate code. Check hook output if edits fail.
- **Error Messages**: Use Spanish messages in validation and toasts (locale: `es-MX` or `es-VE`).
- **Formulas**: Decimal fields use `@db.Decimal(5,2)` not `Int` (e.g., pricing margins).
- **Enum Validation**: Zod enum fields must match backend enum values exactly (e.g., `DiagnosisStatus: 'DRAFT' | 'COMPLETED' | 'APPROVED_INTERNAL'`).

## Useful References

- Memory file: `/Users/alfredocastillo/.claude/projects/-Users-alfredocastillo-Documents-GitHub-autosys/memory/MEMORY.md`



