import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        // Проксирование API запросов для избежания проблем с CORS (для продакшена)
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // URL Django backend
      },
      {
        // Проксирование запросов авторизации
        source: '/users/:path*',
        destination: 'http://localhost:8000/users/:path*', // URL Django users endpoints
      },
    ];
  },
};

export default nextConfig;
