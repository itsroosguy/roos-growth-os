// Set to true to bypass login and route root directly into the dashboard for online testing
const TEMPORARY_BYPASS_AUTH = true;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: TEMPORARY_BYPASS_AUTH ? '/app/acme-corp/overview' : '/login',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
