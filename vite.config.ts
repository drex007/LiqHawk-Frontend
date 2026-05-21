import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Backend URL is sourced from `.env` (VITE_API_BASE) — see `src/api.ts`.
// Nothing about the API host lives in this config any more.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
