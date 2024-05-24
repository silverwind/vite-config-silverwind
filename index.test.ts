import {nodeLib, webLib, webApp} from "./index.ts";
import type {LibraryOptions} from "vite";
import type {OutputOptions} from "rollup";

test("nodeLib", () => {
  const cfg = nodeLib({
    url: import.meta.url,
    build: {
      rollupOptions: {
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
  expect(cfg.build?.rollupOptions?.external).toBeArray();
  expect((cfg.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("[name].js");
  expect((cfg.build?.rollupOptions?.output as OutputOptions)?.inlineDynamicImports).toEqual(true);
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.resolve?.mainFields).not.toContain("browser");
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);
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
  expect((cfg.build?.rollupOptions?.output as OutputOptions).entryFileNames).not.toEqual("[name].js");
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.resolve?.mainFields).toBeFalsy();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);
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
});
