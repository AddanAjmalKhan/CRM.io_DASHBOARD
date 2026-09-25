import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/submissions': ['./src/fonts/**/*.ttf'],
  },
};

export default nextConfig;
