
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fbs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ycoincash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to suppress known warnings from libraries that don't affect the build.
    config.ignoreWarnings = (config.ignoreWarnings || []).concat([
      /require.extensions/, // For Handlebars
      /Critical dependency: the request of a dependency is an expression/ // For OpenTelemetry
    ]);
    return config;
  },
};

export default nextConfig;
