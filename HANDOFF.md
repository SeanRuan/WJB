# Handoff Guide

## What this repo is
- NestJS + Prisma backend for the new Wujibackstage admin system.
- Focused on player service, recharge review, room card tracking, legacy change tracking, guild management, and audit logs.

## How to work here
1. Start from `main` or a feature branch.
2. Run `npm run check`.
3. Run `npm run build`.
4. Keep `.env`, secrets, `node_modules`, and `dist` out of Git.

## Important safety rules
- Do not connect to production directly.
- Prefer staging or read-only replicas.
- `DATABASE_ACCESS_MODE=readonly` blocks writes.

## Main entry points
- `README.md` for quick start.
- `CONTRIBUTING.md` for branch and commit rules.
- `BRANCHING.md` for branch naming.
- `RELEASE_CHECKLIST.md` for release steps.
- `RELEASE_NOTES.md` for version summary.

## Project structure
- `src/` main NestJS application code.
- `prisma/` schema and database models.
- `docs/` decision notes and workflow docs.
- `scripts/` local helper scripts.
- `.github/` PR and issue templates.

## First touch order
1. Read `README.md`.
2. Read `HANDOFF.md`.
3. Check `CONTRIBUTING.md` and `BRANCHING.md`.
4. Run `npm run check`.
5. Run `npm run build`.

## Useful commands
- `npm run start:dev`
- `npm run build`
- `npm run check`
- `npm run prisma:generate`
- `npm run prisma:pull`
