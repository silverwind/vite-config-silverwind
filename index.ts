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
  /** Additional path globs to exclude from .d.ts generation */
  dtsExcludes?: string[],
  /** Disable .d.ts generation */
  noDts?: boolean,
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

const defaultRollupOptions = {output: {}};
const defaultBuild = {rollupOptions: defaultRollupOptions};
const defaultConfig = {build: defaultBuild};

const base = ({url, build: {rollupOptions: {output, ...otherRollupOptions}, ...otherBuild} = {}, esbuild = {}, plugins = [], ...other}: CustomConfig = defaultConfig): ViteConfig => {
  return {
    logLevel: "info",
    clearScreen: false,
    build: {
      ...(url && {outDir: fileURLToPath(new URL("dist", url))}),
      minify: false,
      sourcemap: false,
      emptyOutDir: true,
      chunkSizeWarningLimit: Infinity,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          // for some reason rollup likes to use module name as filename instead of the documented default
          entryFileNames: "[name].js",
          ...output,
        },
        ...otherRollupOptions,
      },
      ...otherBuild,
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

function lib({url, dtsExcludes, noDts, build: {lib = false, rollupOptions = {}, ...otherBuild} = {}, plugins = [], ...other}: CustomConfig = defaultConfig): ViteConfig {
  let dependencies: string[] = [];
  let peerDependencies: string[] = [];

  if (url) {
    ({dependencies, peerDependencies} = JSON.parse(readFileSync(new URL("package.json", url), "utf8")));
  }

  return base({
    url,
    build: {
      target: "esnext",
      lib: {
        ...(url && {entry: fileURLToPath(new URL(libEntryFile, url))}),
        formats: ["es"],
        ...lib,
      },
      rollupOptions: {
        external: [
          ...Object.keys(dependencies || {}),
          ...Object.keys(peerDependencies || {}),
          ...builtinModules,
          ...builtinModules.map(module => `node:${module}`),
        ],
        ...rollupOptions,
      },
      ...otherBuild,
    },
    plugins: dedupePlugins([
      !noDts && dtsPlugin({
        logLevel: "warn",
        exclude: [
          "*.config.*",
          "*.test.*",
          ...(dtsExcludes ?? []),
        ]},
      ),
    ], plugins),
    ...other,
  });
}

export function nodeLib({build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return lib({
    build: {
      target: "esnext",
      ...build,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
        },
      },
    },
    resolve: {
      mainFields: ["module"],
    },
    ...other,
  });
}

export function webLib({build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return lib({
    build: {
      target: "modules",
      cssCodeSplit: true, // needed for css entry points
      assetsInlineLimit: 32768,
      ...build,
    },
    ...other,
  });
}

export function webApp({build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return base({
    build: {
      target: "modules",
      minify: "esbuild",
      assetsInlineLimit: 32768,
      ...build,
    },
    ...other,
  });
}
