import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const base = "/";

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: base,
        name: "Desentradas",
        short_name: "Desentradas",
        lang: "es",
        description:
          "Entradas que solo pagás si faltás a un evento, para fomentar los espacios de encuentro libres y gratuitos.",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png" },
          { src: "icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
