import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [],
    server: {
      allowedHosts: [".ngrok-free.app"],
      hmr: {
        overlay: false,
      }
    }
  }
});
