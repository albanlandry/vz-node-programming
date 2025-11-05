/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for better deployment
  output: 'standalone',
  // Transpile the local package
  transpilePackages: [],
}

module.exports = nextConfig

