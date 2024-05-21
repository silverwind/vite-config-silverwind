import {defineConfig} from "vite";
import {lib} from "./index.ts";

export default defineConfig(lib({
  url: import.meta.url,
  build: {
    rollupOptions: {
      output: {
        // for some reason rollup likes to use module name as filename in default config for this module
        entryFileNames: "[name].js",
      },
    }
  }
}));
