import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import {builtinModules} from "node:module";
import {stringPlugin} from "vite-string-plugin";
import type {Plugin, UserConfig, PluginOption} from "vite";
import dtsPlugin from "vite-plugin-dts";

const uniquePluginName = (plugin: Plugin): string => {
  const apply = typeof plugin.apply === "string" ? plugin.apply : "";
  return `${plugin.name}-${apply}-${String(plugin.enforce)}`;
};

type ViteConfig = UserConfig;
type CustomConfig = ViteConfig & {
  /** The value of import.meta.url from your config file */
  url?: string,
};

function dedupePlugins(libPlugins: PluginOption[], userPlugins: PluginOption[]): PluginOption[] {
  const seen: Set<any> = new Set([]);
  const ret: Plugin[] = [];

  for (const plugin of [...userPlugins, ...libPlugins]) { // prefer user plugins
    const name = plugin ? uniquePluginName(plugin as Plugin) : null;

    if (seen.has(name)) {
      continue;
    } else {
      ret.push(plugin as Plugin);
      if (name) {
        seen.add(name);
      }
    }
  }

  return ret;
}

const base = ({url, build = {}, esbuild = {}, plugins = [], ...other}: CustomConfig = {}): ViteConfig => {
  return {
    logLevel: "info",
    clearScreen: false,
    build: {
      ...(url && {outDir: fileURLToPath(new URL("dist", url))}),
      minify: false,
      sourcemap: false,
      target: "esnext",
      emptyOutDir: true,
      chunkSizeWarningLimit: Infinity,
      assetsInlineLimit: 0,
      reportCompressedSize: false,
      ...build,
    },
    esbuild: {
      legalComments: "none",
      ...esbuild,
    },
    plugins: dedupePlugins([
      stringPlugin(),
    ], plugins),
    ...other,
  };
};

// avoid vite bug https://github.com/vitejs/vite/issues/3295
const libEntryFile = "index.ts";

export function lib({url, build: {lib = false, rollupOptions = {}, ...otherBuild} = {}, plugins = [], ...other}: CustomConfig = {}): ViteConfig {
  let dependencies: string[] = [];
  let peerDependencies: string[] = [];

  if (url) {
    ({dependencies, peerDependencies} = JSON.parse(readFileSync(new URL("package.json", url), "utf8")));
  }

  return base({
    url,
    build: {
      lib: {
        ...(url && {entry: fileURLToPath(new URL(libEntryFile, url))}),
        formats: ["es"],
        ...lib,
      },
      rollupOptions: {
        external: [
          ...Object.keys(dependencies || {}),
          ...Object.keys(peerDependencies || {}),
          ...builtinModules.map(module => `node:${module}`),
        ],
        ...rollupOptions,
      },
      ...otherBuild,
    },
    plugins: dedupePlugins([
      dtsPlugin({exclude: [
        "*.config.*",
        "*.test.*",
      ]}),
    ], plugins),
    ...other,
  });
}

export function app({build = {}, ...other}: CustomConfig = {}): ViteConfig {
  return base({
    build,
    ...other,
  });
}
