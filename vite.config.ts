import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Eventos recurrentes",
        short_name: "Eventos",
        lang: "es",
        display: "standalone",
        start_url: "/",
        scope: "/",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
