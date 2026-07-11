/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "standalone",

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",

        headers: [
          {
            key: "Content-Security-Policy",

            value: [
              "default-src 'self' https: data: blob:;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob: data:;",
              "connect-src * https: wss: ws: data: blob:;",
              "img-src * data: blob: https:;",
              "style-src 'self' 'unsafe-inline' https:;",
              "frame-src * https: data: blob:;",
              "font-src * data: https:;",
              "media-src * blob: data: https:;",
            ].join(" "),
          },

          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
