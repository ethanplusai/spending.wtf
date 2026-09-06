import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ isSsrBuild }) => ({
  publicDir: isSsrBuild ? false : "public",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:4317", "/mcp": "http://127.0.0.1:4317" },
  },
}));
