import { URL } from "node:url";

const r2PublicUrl = process.env.R2_PUBLIC_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@woodaa/ui", "@woodaa/api", "@woodaa/validators"],
  // Next's output tracing can't follow Prisma Client's dynamically loaded
  // native query engine binary, so the serverless bundle silently omits it
  // unless we point tracing at it explicitly.
  outputFileTracingIncludes: {
    "/**": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
    ],
  },
  // Empty when R2_PUBLIC_URL isn't set (e.g. local dev without R2
  // configured yet) - fine, a facility with no configured bucket has no
  // photos to render anyway.
  images: {
    remotePatterns: r2PublicUrl
      ? [
          {
            protocol: /** @type {"http"|"https"} */ (
              new URL(r2PublicUrl).protocol.replace(":", "")
            ),
            hostname: new URL(r2PublicUrl).hostname,
          },
        ]
      : [],
  },
};

export default nextConfig;
