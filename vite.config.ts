// Plain Vite config — no platform wrappers.
//
// Plugin order matters (matches the layout the project was built against):
//   tailwindcss → tsconfig paths → tanstackStart → nitro (build only) → react → PWA
//
// nitro only participates in `vite build`; dev runs tanstackStart alone.
// Deploy target defaults to Node (`node-server`). Override per-deploy with
// the NITRO_PRESET env var (e.g. NITRO_PRESET=cloudflare-module).
import { defineConfig, type PluginOption, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(async ({ command }): Promise<UserConfig> => {
  const buildPlugins: PluginOption[] = [];
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    buildPlugins.push(nitro({ defaultPreset: "node-server" }));
  }

  return {
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Build the server from src/server.ts (our SSR error wrapper).
        server: { entry: "server" },
        // Enforce the client/server boundary: client-reachable files may not
        // statically import **/server/** — server code goes through
        // createServerFn handlers with dynamic import() (see src/lib/data.ts).
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      ...buildPlugins,
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icon.svg", "robots.txt"],
        manifest: {
          name: "Steady — Placement Prep Tracker",
          short_name: "Steady",
          description: "A calm placement prep tracker with AI-powered notes and practice",
          theme_color: "#6B9B8E",
          background_color: "#FAFAF9",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,ico,txt,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
        },
      }),
    ],
  };
});
