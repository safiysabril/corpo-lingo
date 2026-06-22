import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// ⚠️ This file carries the monorepo wiring. Do NOT overwrite it with Lovable's
// vite.config.ts — keep the `@corpo-lingo/shared` alias, the `/api` proxy, and the
// port below. (lovable-tagger is intentionally omitted; it only matters inside Lovable.)
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      // Forward API calls to the backend so the httpOnly auth cookie stays same-origin.
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use the shared package straight from source so type/const edits hot-reload.
      "@corpo-lingo/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
});
