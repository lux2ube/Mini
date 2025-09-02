
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
    // This is to suppress the Handlebars "require.extensions" warning.
    // It's a known issue with older libraries in Webpack 5+ and doesn't affect the build.
    config.ignoreWarnings = (config.ignoreWarnings || []).concat([
      /require.extensions/,
    ]);
    return config;
  },
};

export default nextConfig;
