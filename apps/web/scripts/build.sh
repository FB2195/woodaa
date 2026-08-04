#!/usr/bin/env bash
set -euo pipefail

# Vercel Preview deployments (PR builds) share the production Neon database -
# there's no separate preview DB provisioned. Running `prisma migrate deploy`
# there means every PR build tests migrations directly against production
# before anyone has reviewed them, and `prisma db seed` runs against
# production on every push to the PR. CI (.github/workflows/ci.yml) already
# applies every migration to a fresh, disposable Postgres on each PR, so
# skipping the DB step here on Preview loses no real coverage - it just
# stops treating production as the test environment.
if [ "${VERCEL_ENV:-}" != "preview" ]; then
  pnpm --filter @woodaa/db exec prisma migrate deploy
  pnpm --filter @woodaa/db seed
fi

next build
