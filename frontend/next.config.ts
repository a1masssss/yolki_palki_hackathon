import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add environment variables configuration
  env: {
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  async rewrites() {
    return [
      {
        // Проксирование API запросов для избежания проблем с CORS (для продакшена)
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*", // URL Django backend
      },
      {
        // Проксирование запросов авторизации
        source: "/users/:path*",
        destination: "http://localhost:8000/users/:path*", // URL Django users endpoints
      },
    ];
  },
};

export default nextConfig;
