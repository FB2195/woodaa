import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { appRouter, createContext } from "@woodaa/api";
import Fastify from "fastify";

const server = Fastify({ logger: true });

async function main() {
  await server.register(cors, { origin: true });

  await server.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: ({ req }: CreateFastifyContextOptions) => {
        const header = req.headers.authorization;
        const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
        return createContext({ token });
      },
    },
  });

  server.get("/health", async () => ({ status: "ok" }));

  const port = Number(process.env.PORT ?? 4000);
  await server.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  server.log.error(err);
  process.exit(1);
});
