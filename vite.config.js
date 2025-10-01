// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Конфігурація Vite
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Якщо ви використовуєте абсолютні імпорти, це допоможе
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Якщо ви хочете, щоб Vite використовував ваш index.html
  build: {
    outDir: "dist",
  },
});
