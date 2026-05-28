/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: "*.public.blob.vercel-storage.com",
      },

      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },

      {
        protocol: "https",
        hostname: "images.unsplash.com",
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
              "default-src 'self' data: blob: https:;",

              // PI SDK + NEXT
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:;",

              // API / websocket / Pi SDK
              "connect-src 'self' https: wss: blob:;",

              // image
              "img-src 'self' https: data: blob:;",

              // style
              "style-src 'self' 'unsafe-inline' https:;",

              // iframe/payment/pi browser
              "frame-src 'self' https:;",

              // fonts
              "font-src 'self' https: data:;",

              // media
              "media-src 'self' https: blob:;",
            ].join(" "),
          },

          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=()",
          },

          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
