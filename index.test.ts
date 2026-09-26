import {nodeLib, nodeCli, webLib, webApp, makeExcludes} from "./index.ts";
import type {LibraryOptions, Rolldown} from "vite";

test("nodeLib", () => {
  const cfg = nodeLib({
    url: import.meta.url,
    build: {
      rolldownOptions: {
        external: ["foo"],
        output: {
          entryFileNames: "foo.js",
        },
      },
    },
  });
  expect(cfg.build?.target).toEqual("node22");
  expect(cfg.build?.lib).toBeTruthy();
  expect((cfg.build?.lib as LibraryOptions)?.entry).toBeTruthy();
  expect(cfg.build?.rolldownOptions?.external).toBeArray();
  expect(cfg.build?.rolldownOptions?.external).toEqual(expect.arrayContaining(["foo"]));
  expect((cfg.build?.rolldownOptions?.external as Array<string>).filter(name => name.startsWith("node:node:"))).toEqual([]);
  expect((cfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).entryFileNames).toEqual("foo.js");
  expect((cfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).codeSplitting).toEqual(false);
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);

  const multiEntryCfg = nodeLib({url: import.meta.url, build: {lib: {entry: {a: "a.ts", b: "b.ts"}}}});
  expect((multiEntryCfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).codeSplitting).toBeUndefined();

  const isExternal = nodeLib({url: import.meta.url, build: {rolldownOptions: {external: id => id === "foo"}}})
    .build?.rolldownOptions?.external as Rolldown.ExternalOptionFunction;
  expect(["foo", "vite", "node:fs", "bar"].map(id => isExternal(id, undefined, false))).toEqual([true, true, true, false]);
});

test("nodeCli", () => {
  const cfg = nodeCli({
    url: import.meta.url,
  });
  expect((cfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).entryFileNames).toEqual("[name].js");
});

test("webLib", () => {
  const cfg = webLib({
    url: import.meta.url,
    build: {
      rolldownOptions: {
        output: {
          entryFileNames: "foo.js",
        },
      },
    },
  });
  expect(cfg.build?.lib).toBeTruthy();
  expect((cfg.build?.lib as LibraryOptions)?.entry).toBeTruthy();
  expect(cfg.build?.rolldownOptions?.external).toBeArray();
  expect((cfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).codeSplitting).not.toEqual(false);
  expect((cfg.build?.rolldownOptions?.output as Rolldown.OutputOptions).entryFileNames).toEqual("foo.js");
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.resolve?.mainFields).toBeFalsy();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(2);
});

test("webapp", () => {
  const cfg = webApp({
    url: import.meta.url,
    dts: true,
    dtsOpts: {},
    dtsExcludes: [],
    replaceExternal: true,
  });
  expect(Object.keys(cfg)).toEqual(["logLevel", "clearScreen", "build", "plugins"]);
  expect(cfg.build?.emptyOutDir).toBeTrue();
  expect(cfg.plugins).toBeArray();
  expect(cfg.plugins).toHaveLength(1);
  expect(cfg.resolve?.mainFields).toBeFalsy();
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
          "\${configDir}/**/*.setup.*",
          "\${configDir}/**/*.stories.*",
          "\${configDir}/**/*.test.*",
          "\${configDir}/**/.air/**",
          "\${configDir}/**/.git/**",
          "\${configDir}/**/.make/**",
          "\${configDir}/**/.ruff_cache/**",
          "\${configDir}/**/.storybook/*",
          "\${configDir}/**/.swc/**",
          "\${configDir}/**/.venv/**",
          "\${configDir}/**/build/**",
          "\${configDir}/**/dist/**",
          "\${configDir}/**/fixtures/**",
          "\${configDir}/**/node_modules/**",
          "\${configDir}/**/persistent/**",
          "\${configDir}/**/tests/**",
          "\${configDir}/build.js",
          "\${configDir}/eslintrc.js",
          "\${configDir}/globals.js"
        ],
      }"
  `);
});
