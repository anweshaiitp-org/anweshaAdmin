import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/users/:userId',
        destination: '/admin/users/:userId',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
