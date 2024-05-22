import {defineConfig} from "vite";
import {lib} from "./index.ts";

export default defineConfig(lib({
  url: import.meta.url,
}));
