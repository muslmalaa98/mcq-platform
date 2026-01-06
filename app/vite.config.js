import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      // أثناء التطوير: أي طلب /api يروح لووركر dev
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  }
});
