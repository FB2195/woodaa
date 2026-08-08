import type { AppRouter } from "@woodaa/api";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
