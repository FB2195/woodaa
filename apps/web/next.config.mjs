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
};

export default nextConfig;
