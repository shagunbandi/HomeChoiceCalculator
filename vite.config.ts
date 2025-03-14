import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import themeJson from "@replit/vite-plugin-shadcn-theme-json";

export default defineConfig({
  plugins: [
    react(),
    themeJson(),
  ],
  root: path.resolve(__dirname, "client"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
