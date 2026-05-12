/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
      preventFullImport: true,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'castilloitsystems.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Configuración necesaria para NextAuth
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return [];
    }
    return [
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/[...nextauth]",
      },
    ];
  },

  // Mantener tus redirects existentes
  async redirects() {
    return [
      {
        source: "/apps/mail",
        destination: "/apps/mail/inbox",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
