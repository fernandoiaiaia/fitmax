/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig = {
  async rewrites() {
    return [
      // Proxy todas as chamadas /api/* para o servidor Express
      // Isso resolve o SameSite cookie issue em dev:
      // o browser envia o cookie porque a origem passa a ser localhost:3002
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      // Proxy das imagens de avatar (servidas estaticamente pelo Express)
      {
        source: '/uploads/:path*',
        destination: `${API_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

