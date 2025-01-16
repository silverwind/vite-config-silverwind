import {defineConfig} from "vitest/dist/config.js";
import {backend} from "vitest-config-silverwind";

// @ts-expect-error type issue in vitest related to "stringify" option
export default defineConfig(backend({url: import.meta.url}));
