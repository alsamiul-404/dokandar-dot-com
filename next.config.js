const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  scope: "/",
  /** Offline-first: cache static UI, fonts, icons, Next chunks only — never cache /api */
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.maateen\.me\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "dokandar-fonts-cdn",
        expiration: { maxEntries: 6, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        /\/fonts\/.*\.(ttf|otf|woff2?)$/i.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "dokandar-fonts-local",
        expiration: { maxEntries: 12, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.origin === self.location.origin &&
        /\/icons\/.*\.(svg|png|webp|ico)$/i.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "dokandar-icons",
        expiration: { maxEntries: 24, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/manifest\.json$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "dokandar-manifest",
        expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 120, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" && url.origin === self.location.origin,
      handler: "NetworkFirst",
      options: {
        cacheName: "dokandar-pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    },
  ],
};

module.exports = withPWA(nextConfig);
