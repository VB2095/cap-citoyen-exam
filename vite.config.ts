import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      filename: "service-worker.js",
      includeAssets: ["icons/*.png"],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,json,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/")) return "vendor";
          if (id.endsWith("/official-bank.js") || id.endsWith("/questions.js") || id.endsWith("/src/knowledge-engine.js")) {
            return "civic-content";
          }
        },
      },
    },
  },
});
