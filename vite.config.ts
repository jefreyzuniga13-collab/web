import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { VitePWA } from "vite-plugin-pwa";

const appBuildId = `${Date.now()}`;

function writeAppVersionFile(outDir: string): void {
  const payload = {
    buildId: appBuildId,
    builtAt: new Date().toISOString(),
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "version.json"),
    JSON.stringify(payload, null, 2),
    "utf-8"
  );
}

/**
 * Script inline: corre antes del bundle. Si el deploy cambió,
 * tumba SW + caches y recarga (sin depender del JS viejo en caché).
 */
function injectVersionBootstrap(): Plugin {
  const bootstrap = `
<script>
(function () {
  var KEY = "orbitra.app.buildId";
  var BUILD = ${JSON.stringify(appBuildId)};
  var prev = null;
  try { prev = localStorage.getItem(KEY); } catch (e) {}

  if (prev === BUILD) return;

  try { localStorage.setItem(KEY, BUILD); } catch (e) {}

  // Primera vez sin SW controlador: solo guarda y sigue.
  if (!prev && !("serviceWorker" in navigator && navigator.serviceWorker.controller)) {
    return;
  }

  var done = function () {
    location.reload();
  };

  var tasks = [];

  if ("serviceWorker" in navigator) {
    tasks.push(
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      })
    );
  }

  if ("caches" in window) {
    tasks.push(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    );
  }

  Promise.all(tasks).then(done).catch(done);
})();
</script>`.trim();

  return {
    name: "orbitra-version-bootstrap",
    transformIndexHtml(html) {
      return html.replace("<head>", `<head>\n    ${bootstrap}`);
    },
  };
}

export default defineConfig({
  base: "/crm/",

  plugins: [
    react(),
    injectVersionBootstrap(),

    {
      name: "orbitra-app-version",
      apply: "build",
      closeBundle() {
        writeAppVersionFile(path.resolve(__dirname, "dist"));
      },
    },

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

        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        // NUNCA precachear html/js/css: eso dejaba la UI vieja pegada.
        globPatterns: ["**/*.{ico,png,svg,webp,woff,woff2}"],

        // Sin fallback a index cacheado: navegación siempre a red.
        navigateFallback: null,

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/version\.json$/i,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /\/assets\/.*\.(?:js|css)$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "crm-assets-netfirst",
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 6,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "crm-images",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
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
