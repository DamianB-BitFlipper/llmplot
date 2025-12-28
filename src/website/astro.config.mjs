import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  site: "https://www.damianb.dev",
  base: "/llmplot",
  outDir: "../../dist/website",
  vite: {
    resolve: {
      alias: {
        "@core": path.resolve(__dirname, "../core"),
      },
    },
  },
});
