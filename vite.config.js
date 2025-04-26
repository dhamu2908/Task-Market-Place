import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    allowedHosts: "all",                 // accept any Host header
    hmr: {
      protocol: "wss",                   // ngrok serves HTTPS → WSS
      host: "e012-103-158-43-20.ngrok-free.app", // TODAY’S tunnel
      clientPort: 443
    }
  }
});
