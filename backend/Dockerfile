FROM node:20-slim

WORKDIR /app

# Cliente de PostgreSQL 17 (pg_dump/pg_restore) desde el repo oficial PGDG.
# node:20-slim = Debian bookworm, cuyo postgresql-client por defecto es v15 y NO
# puede respaldar el servidor Supabase (PostgreSQL 17): pg_dump aborta por
# "server version mismatch". Instalamos el cliente 17 explícitamente.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl curl ca-certificates gnupg \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
         -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" \
         > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update -y \
    && apt-get install -y --no-install-recommends postgresql-client-17 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm install --ignore-scripts

COPY . .

RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

RUN node --max-old-space-size=4096 node_modules/.bin/tsc

EXPOSE 4000

CMD ["node", "dist/index.js"]
