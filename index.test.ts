import {lib, app} from "./index.ts";
import type {LibraryOptions} from "vite";

test("config", () => {
  expect(lib().build.lib).toBeTruthy();
  expect((lib({url: import.meta.url}).build.lib as LibraryOptions).entry[0]).toBeTruthy();
  expect(lib().build.rollupOptions.external).toBeArray();
  expect(lib().build.rollupOptions.external).toBeArray();
  expect(lib().build.emptyOutDir).toBeTrue();
  expect(app().build.emptyOutDir).toBeTrue();
});
