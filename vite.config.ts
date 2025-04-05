import {defineConfig} from "vite";
import {nodeLib} from "./index.ts";

export default defineConfig(nodeLib({
  url: import.meta.url,
  dtsOpts: {args: ["--project", "tsconfig.types.json"]},
}));
