import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  ssr: false,
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".ngrok-free.app"],
      hmr: {
        overlay: false,
      }
    }
  }
});
