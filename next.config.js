/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for better deployment
  output: 'standalone',
  // Transpile the local package
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Externalize vm2 for server-side only (it's a Node.js library)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'vm2': 'commonjs vm2',
      });
    }
    
    // Ignore optional dependencies of vm2
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'coffee-script': false,
    };
    
    return config;
  },
}

module.exports = nextConfig

