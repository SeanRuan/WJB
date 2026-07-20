# Wujibackstage

Mahjong game admin backend scaffolded for a separate new back office, using NestJS, Prisma, and SQL Server.

## Safety first

- Do not connect this project to the live production database while the existing back office is still operating.
- Use a development or staging MSSQL copy, or a read-only account against a safe replica.
- Keep the first phase limited to read-only features such as player lookup, audit lookup, and internal verification.

## Quick start

1. Copy `.env.example` to `.env`
2. Run `npm install`
3. Keep `DATA_SOURCE=mock` to run safely without MSSQL during early backend/frontend development
4. Run `npm run prisma:generate`
5. Run `npm run start:dev`

## Switch to MSSQL later

1. Set `DATA_SOURCE=prisma`
2. Update `DATABASE_URL` to a non-production MSSQL connection string
3. Run `npm run prisma:pull` if you need to introspect an existing schema
4. Restart `npm run start:dev`

## Notes

- `prisma/schema.prisma` currently contains a minimal placeholder model set for the new backend.
- Running `npm run prisma:pull` will update that schema to match the target MSSQL database.
- The current API scaffold is intentionally read-only.
- `DATA_SOURCE=mock` returns fixed read-only data for `/api/players` and `/api/audit-logs` so development can continue before DB credentials are ready.
- Non-read HTTP methods are blocked when `DATABASE_ACCESS_MODE=readonly`.
- Prisma mutating actions (`create`, `update`, `delete`, `upsert`, `executeRaw`) are blocked in readonly mode as a second safety guard.

## Stack

- NestJS for the backend application structure
- Prisma for database access
- SQL Server for a development or staging copy of the existing game data source

## Available scripts

- `npm run start:dev` starts the backend in watch mode
- `npm run build` compiles the NestJS application into `dist`
- `npm run check` runs TypeScript type checking without emitting files
- `npm run prisma:generate` generates the Prisma client
- `npm run prisma:pull` introspects the existing MSSQL schema into Prisma
