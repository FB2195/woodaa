import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { appRouter, createContext, recomputeAllCapacityCaches } from "@woodaa/api";
import { db } from "@woodaa/db";
import Fastify from "fastify";

const server = Fastify({ logger: true });

// Date-ranged categories (Kurzzeit-/Tages-/Nachtpflege) can flip from
// "occupied" to "free" purely because midnight passed, with no booking
// mutation happening at that exact moment - this catches that rollover.
// syncCapacityCache (called on every booking/unit change) already keeps the
// cache correct in between, so an hourly cadence is just a safety net, not
// the primary mechanism.
const CAPACITY_ROLLOVER_INTERVAL_MS = 60 * 60 * 1000;

function scheduleCapacityRollover() {
  const run = () => {
    recomputeAllCapacityCaches(db).catch((err) => {
      server.log.error(err, "capacity rollover recompute failed");
    });
  };
  run();
  setInterval(run, CAPACITY_ROLLOVER_INTERVAL_MS);
}

async function main() {
  await server.register(cors, { origin: true });

  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: ({ req }: CreateFastifyContextOptions) => {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
        return createContext({ token, ip: req.ip });
      },
    },
  });

  server.get("/health", async () => ({ status: "ok" }));

  scheduleCapacityRollover();

  const port = Number(process.env.PORT ?? 4000);
  await server.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
