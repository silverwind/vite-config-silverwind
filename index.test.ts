import {nodeLib, nodeCli, webLib, webApp, makeExcludes} from "./index.ts";
import type {LibraryOptions} from "vite";
import type {OutputOptions} from "rollup";

test("nodeLib", () => {
  const cfg = nodeLib({
    url: import.meta.url,
    build: {
      rollupOptions: {
        external: ["foo"],
        output: {
          entryFileNames: "foo.js",
        },
      },
    },
  });
  expect(cfg.build?.target).toEqual("esnext");
  expect(cfg.build?.lib).toBeTruthy();
  expect((cfg.build?.lib as LibraryOptions)?.entry).toBeTruthy();
  expect(cfg.build?.rollupOptions?.external).toBeArray();
  expect(cfg.build?.rollupOptions?.external).toInclude("foo");
  expect((cfg.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("foo.js");
  expect((cfg.build?.rollupOptions?.output as OutputOptions)?.inlineDynamicImports).toEqual(true);
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);
  expect(cfg.build?.minify).toBeFalsy();
});

test("nodeCli", () => {
  const cfg = nodeCli({
    url: import.meta.url,
  });
  expect((cfg.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("[name].js");
  expect(cfg.build?.minify).toBeTruthy();
});

test("webLib", () => {
  const cfg = webLib({
    url: import.meta.url,
    build: {
      rollupOptions: {
        output: {
          entryFileNames: "foo.js",
        },
      },
    },
  });
  expect(cfg.build?.target).toEqual("modules");
  expect(cfg.build?.lib).toBeTruthy();
  expect((cfg.build?.lib as LibraryOptions)?.entry)?.toBeTruthy();
  expect(cfg.build?.rollupOptions?.external).toBeArray();
  expect(cfg.build?.rollupOptions?.external).toBeArray();
  expect((cfg.build?.rollupOptions?.output as OutputOptions)?.inlineDynamicImports).not.toEqual(true);
  expect((cfg.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("foo.js");
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.resolve?.mainFields).toBeFalsy();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);
  expect(cfg.build?.minify).toBeFalsy();
});

test("webapp", () => {
  const cfg = webApp({
    url: import.meta.url,
  });
  expect(cfg.build?.target).toEqual("modules");
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(1);
  expect(cfg.resolve?.mainFields).toBeFalsy();
  expect(cfg.build?.minify).toBeTruthy();
});

test("makeExcludes", () => {
  expect(makeExcludes([
    "build.js",
    "eslintrc.js",
    "globals.js",
  ])).toMatchInlineSnapshot(`
    "{
        "extends": "./tsconfig.json",
        "exclude": [
          "\${configDir}/**/*.config.*",
          "\${configDir}/**/*.test.*",
          "\${configDir}/**/.air/**",
          "\${configDir}/**/.git/**",
          "\${configDir}/**/.make/**",
          "\${configDir}/**/.ruff_cache/**",
          "\${configDir}/**/.venv/**",
          "\${configDir}/**/.swc/**",
          "\${configDir}/**/build/**",
          "\${configDir}/**/dist/**",
          "\${configDir}/**/node_modules/**",
          "\${configDir}/**/persistent/**",
          "\${configDir}/build.js",
          "\${configDir}/eslintrc.js",
          "\${configDir}/globals.js"
        ],
      }"
  `);
});
