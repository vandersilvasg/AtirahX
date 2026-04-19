import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableTagger = env.VITE_ENABLE_COMPONENT_TAGGER === "true";

  return {
    // Base URL - use "/" para dominio raiz ou subdominio.
    // Se estiver em subpasta, mude para "/subpasta/".
    base: "/",

    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },

    server: {
      host: "::",
      port: 8080,
    },

    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-select",
            ],
            "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
            "date-vendor": ["date-fns", "dayjs", "react-day-picker"],
            "icon-vendor": ["lucide-react"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    plugins: [react(), enableTagger && componentTagger()].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    optimizeDeps: {
      include: ["cmdk"],
      force: true,
    },

    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
      css: false,
    },
  };
});
