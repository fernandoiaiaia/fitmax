/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`, // Proxy to Express backend
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
