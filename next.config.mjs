/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: false,
   eslint: {
    ignoreDuringBuilds: true, // disables ESLint checks when building
  },
};

export default nextConfig;
