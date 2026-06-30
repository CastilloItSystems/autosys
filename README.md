# AutoSys

Sistema de gestión integral para talleres y concesionarios automotrices
(AutoSys — CastilloItSystems). Cubre recepción de vehículos, órdenes de
servicio, diagnósticos, cotizaciones, inventario multi-almacén, ventas,
facturación, CRM y módulo de concesionario, con arquitectura multi-empresa
(multi-tenant).

## Arquitectura

Monorepo con dos aplicaciones:

| Carpeta     | Stack                                             |
| ----------- | ------------------------------------------------- |
| `backend/`  | Express.js (ES modules) + Prisma ORM + PostgreSQL |
| `frontend/` | Next.js 14 (App Router) + PrimeReact + TypeScript |

- **Multi-tenant**: toda petición lleva la empresa en el header `X-Empresa-Id`;
  el backend filtra cada consulta por `empresaId`.
- **Autenticación**: JWT + control de acceso por permisos (RBAC).
- **Almacenamiento de archivos**: Cloudflare R2 (compatible S3).

## Requisitos

- Node.js 20+
- PostgreSQL 14+
- npm

## Puesta en marcha

### Backend

```bash
cd backend
cp .env.example .env        # configurar DATABASE_URL, JWT, R2, etc.
npm install
npm run prisma:migrate      # merge de modelos + migraciones
npm run seed                # datos iniciales (opcional)
npm run dev                 # servidor de desarrollo (tsx watch)
```

Otros comandos: `npm run build` (compila TS), `npm test` (Jest),
`npm run prisma:merge` (regenera `schema.prisma` desde `prisma/models/`).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # configurar NEXT_PUBLIC_API_URL, etc.
npm install
npm run dev                 # http://localhost:3000
```

Otros comandos: `npm run build`, `npm run lint`, `npm run format`.

## Notas importantes

- `backend/prisma/schema.prisma` es **autogenerado**. Editar los modelos en
  `backend/prisma/models/**/*.prisma` y correr `npm run prisma:merge`.
- Los IDs usan formato `cuid()` (no UUID).
- Mensajes de validación y de UI en español (`es-MX` / `es-VE`).

## Documentación

- `CLAUDE.md` — guía de patrones y convenciones del repositorio (la referencia
  más completa para nuevos desarrolladores).
- `ARCHITECTURE_PATTERNS.md`, `INVENTORY_MODULE_UPDATE.md`,
  `WORKSHOP_CHECKLIST_SYSTEM_EXPLORATION.md` y la carpeta `contextos/` —
  documentación por dominio.
