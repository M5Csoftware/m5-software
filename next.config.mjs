/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: false,
   eslint: {
    ignoreDuringBuilds: true, // disables ESLint checks when building
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://m5c-server.vercel.app/api/:path*',
        
      },
    ];
  },
};

export default nextConfig;
