import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { ProxyOptions } from "vite";

function apiProxy(): ProxyOptions {
  return {
    target: process.env.DENTIQ_API_TARGET || "http://127.0.0.1:5000",
    configure(proxy) {
      proxy.on("error", (_error, _request, response) => {
        if ("writeHead" in response && !response.headersSent) {
          response.writeHead(503, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ success: false, message: "The backend API is unavailable. Start the API with npm run dev:api from the project root.", errors: [] }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: { "/api": apiProxy(), "/health": apiProxy() } },
  preview: { proxy: { "/api": apiProxy(), "/health": apiProxy() } },
});
