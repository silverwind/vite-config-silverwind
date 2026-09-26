import {nodeLib, nodeCli, webLib, webApp, makeExcludes} from "./index.ts";
import type {Rolldown} from "vite";

const url = import.meta.url;

test("nodeLib", () => {
  const {build, plugins} = nodeLib({url, build: {rolldownOptions: {external: ["foo"], output: {entryFileNames: "foo.js"}}}});
  expect(build).toMatchObject({target: "node22", lib: {entry: expect.stringMatching(/index\.ts$/)}, emptyOutDir: true});
  expect(build!.rolldownOptions!.output).toEqual({entryFileNames: "foo.js", comments: {legal: false}, codeSplitting: false});
  expect((build!.rolldownOptions!.external as Array<string>).filter(id => id === "foo" || id.startsWith("node:node:"))).toEqual(["foo"]);
  expect(plugins).toEqual([expect.anything(), expect.anything()]);

  expect(nodeLib({url, build: {lib: {entry: {a: "a.ts", b: "b.ts"}}}}).build!.rolldownOptions!.output).toEqual({entryFileNames: "[name].js", comments: {legal: false}});

  const isExternal = nodeLib({url, build: {rolldownOptions: {external: id => id === "foo"}}}).build!.rolldownOptions!.external as Rolldown.ExternalOptionFunction;
  expect(["foo", "vite", "node:fs", "bar"].map(id => isExternal(id, undefined, false))).toEqual([true, true, true, false]);

  for (const external of ["foo", /foo/]) {
    expect(nodeLib({url, build: {rolldownOptions: {external}}}).build!.rolldownOptions!.external).toEqual(expect.arrayContaining(["vite", "node:fs", external]));
  }
});

test("nodeCli", () => {
  expect(nodeCli({url}).build!.rolldownOptions!.output).toEqual({entryFileNames: "[name].js", comments: {legal: false}, codeSplitting: false});
});

test("webLib", () => {
  const {build, plugins, resolve} = webLib({url, build: {rolldownOptions: {output: {entryFileNames: "foo.js"}}}});
  expect(build).toMatchObject({lib: {entry: expect.stringMatching(/index\.ts$/)}, rolldownOptions: {external: expect.any(Array)}, emptyOutDir: true});
  expect(build!.rolldownOptions!.output).toEqual({entryFileNames: "foo.js", comments: {legal: false}});
  expect(resolve?.mainFields).toBeFalsy();
  expect(plugins).toEqual([expect.anything(), expect.anything()]);
});

test("webapp", () => {
  const cfg = webApp({url, dts: true, dtsOpts: {}, dtsExcludes: [], replaceExternal: true});
  expect(Object.keys(cfg)).toEqual(["logLevel", "clearScreen", "build", "plugins"]);
  expect(cfg).toMatchObject({build: {emptyOutDir: true}, plugins: [expect.anything()]});
});

test("makeExcludes", () => {
  expect(makeExcludes(["build.js", "eslintrc.js", "globals.js"])).toMatchInlineSnapshot(`
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
