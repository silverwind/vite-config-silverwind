import {lib, app} from "./index.ts";
import type {LibraryOptions} from "vite";
import type {OutputOptions} from "rollup";

test("lib", () => {
  expect(lib()?.build?.target).toEqual("esnext");
  expect(lib()?.build?.lib).toBeTruthy();
  expect((lib({url: import.meta.url})?.build?.lib as LibraryOptions)?.entry)?.toBeTruthy();
  expect(lib()?.build?.rollupOptions?.external).toBeArray();
  expect(lib()?.build?.rollupOptions?.external).toBeArray();
  expect((lib()?.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("[name].js");
  expect((lib({build: {rollupOptions: {output: {entryFileNames: "foo.js"}}}})?.build?.rollupOptions?.output as OutputOptions).entryFileNames).toEqual("foo.js");
  expect(lib()?.build?.emptyOutDir).toBeTrue();
  expect(lib()?.plugins).toBeArray();
  expect(lib()?.plugins).toHaveLength(2);
});

test("app", () => {
  expect(app()?.build?.target).toEqual("modules");
  expect(app()?.build?.emptyOutDir).toBeTrue();
  expect(app()?.plugins).toBeArray();
  expect(app()?.plugins).toHaveLength(1);
});
