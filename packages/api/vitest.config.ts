import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests (*.integration.test.ts) hit a real Postgres and run
    // migrations against it - sequential, not parallel, since they share
    // one test database (see src/testDb.ts).
    fileParallelism: false,
    // Points @woodaa/db's shared `db` client at a dedicated test database
    // (never the dev/prod one) - see src/testDb.ts for setup. Overridable
    // via a real env var (e.g. in CI) since Vitest's `env` only fills in
    // what isn't already set in process.env.
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgresql://user:localdev@localhost:5432/woodaa_test",
    },
  },
});
