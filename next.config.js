// Set to true to bypass login and route root directly into the dashboard for online testing
const TEMPORARY_BYPASS_AUTH = false;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: TEMPORARY_BYPASS_AUTH ? '/app/demo-corp/overview' : '/login',
        permanent: false,
      },
      {
        source: '/app/acme-corp/:path*',
        destination: '/app/demo-corp/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
