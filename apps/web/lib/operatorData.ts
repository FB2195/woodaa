import { cache } from "react";
import { getTrpcServer } from "./trpc-server";

// React.cache() memoizes per request/render pass - the dashboard layout
// and each of its section pages independently need `me`/`myFacility`, and
// without this every navigation would fire the same two queries twice
// (once from the layout, once from the page). getTrpcServer() itself stays
// uncached (it reads the session cookie fresh each call), only the actual
// data fetch below is deduped.
export const getMe = cache(async () => {
  const trpcServer = await getTrpcServer();
  return trpcServer.auth.me();
});

export const getMyFacility = cache(async () => {
  const trpcServer = await getTrpcServer();
  return trpcServer.operator.myFacility();
});
