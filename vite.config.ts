import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/crm/",

  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      manifestFilename: "manifest.json",

      manifest: {
        name: "ORBITRA PCG",
        short_name: "ORBITRA PCG",
        description:
          "ORBITRA de atención, chat, clientes y ventas.",
        start_url: "/crm/",
        scope: "/crm/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0f172a",
        background_color: "#1c0f2a",
        lang: "es",

        icons: [
          {
            src: "https://i.ibb.co/fV4QWkgy/icono-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://i.ibb.co/k2P1Sz7S/icono-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "https://i.ibb.co/k2P1Sz7S/icono-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        maximumFileSizeToCacheInBytes:
          5 * 1024 * 1024,

        globPatterns: [
          "**/*.{js,css,html,ico,png,svg}",
        ],

        navigateFallback: "index.html",
        navigateFallbackDenylist: [
          /^\/api\//,
          /\/manifest\.(webmanifest|json)$/i,
        ],

        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "image",

            handler: "CacheFirst",

            options: {
              cacheName: "crm-images",

              expiration: {
                maxEntries: 80,
                maxAgeSeconds:
                  60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
    {
      name: "strip-manifest-on-login-html",
      enforce: "post",
      transformIndexHtml(html) {
        return html.replace(/<link[^>]+rel=["']manifest["'][^>]*>/gi, "");
      },
    },
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 2600,
  },
});