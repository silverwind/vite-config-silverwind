import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import {builtinModules} from "node:module";
import {exec} from "node:child_process";
import {promisify} from "node:util";
import {stringPlugin} from "vite-string-plugin";
import type {Plugin, UserConfig as ViteConfig, PluginOption} from "vite";
import dtsPlugin from "vite-plugin-dts";

const uniquePluginName = (plugin: Plugin): string => {
  const apply = typeof plugin.apply === "string" ? plugin.apply : "";
  return `${plugin.name}-${apply}-${String(plugin.enforce)}`;
};

type CustomConfig = ViteConfig & {
  /** The value of import.meta.url from your config file */
  url: string,
  /** Additional path globs to exclude from .d.ts generation */
  dtsExcludes?: string[],
  /** Whether to generate .d.ts */
  dts?: boolean,
  /** Whether to use tsc instead of vite-plugin-dts */
  dtsUseTsc?: boolean,
  /** Additional tsc command line arguments */
  dtsTscArgs?: string,
};

const tscTypeDefsPlugin = ({args = ""}: {args: string}): Plugin => ({
  name: "type-defs-plugin",
  buildEnd: async (err?: Error) => {
    if (err) return;
    let cmd = "npx tsc --noEmit false --emitDeclarationOnly true --outDir dist";
    if (args) cmd = `${cmd} ${args}`;
    await promisify(exec)(cmd);
  },
});

function dedupePlugins(libPlugins: PluginOption[], userPlugins: PluginOption[]): PluginOption[] {
  const seen: Set<any> = new Set([]);
  const ret: Plugin[] = [];

  for (const plugin of [...userPlugins, ...libPlugins]) { // prefer user plugins
    const name = plugin ? uniquePluginName(plugin as Plugin) : null;

    if (seen.has(name) || !plugin) {
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

const defaultRollupOptions = {output: {}, external: []};
const defaultBuild = {rollupOptions: defaultRollupOptions};
const defaultConfig = {url: "", build: defaultBuild};

const base = ({url, build: {rollupOptions: {output, ...otherRollupOptions} = defaultRollupOptions, ...otherBuild} = defaultBuild, esbuild = {}, plugins = [], ...other}: CustomConfig = defaultConfig): ViteConfig => {
  return {
    logLevel: "info",
    clearScreen: false,
    build: {
      outDir: fileURLToPath(new URL("dist", url)),
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

function lib({url, dtsExcludes, dts = true, dtsUseTsc = false, dtsTscArgs = "", build: {lib = false, rollupOptions: {external = [], ...otherRollupOptions} = defaultRollupOptions, ...otherBuild} = defaultBuild, plugins = [], ...other}: CustomConfig = defaultConfig): ViteConfig {
  let dependencies: string[] = [];
  let peerDependencies: string[] = [];
  ({dependencies, peerDependencies} = JSON.parse(readFileSync(new URL("package.json", url), "utf8")));

  return base({
    url,
    build: {
      target: "esnext",
      lib: {
        entry: fileURLToPath(new URL(libEntryFile, url)),
        formats: ["es"],
        ...lib,
      },
      rollupOptions: {
        maxParallelFileOps: 100, // workaround for https://github.com/rollup/rollup/issues/5848
        external: [
          ...Object.keys(dependencies || {}),
          ...Object.keys(peerDependencies || {}),
          ...builtinModules,
          ...builtinModules.map(module => `node:${module}`),
          ...(Array.isArray(external) ? external : []),
        ],
        ...otherRollupOptions,
      },
      ...otherBuild,
    },
    plugins: dedupePlugins([
      dts && !dtsUseTsc && dtsPlugin({
        logLevel: "warn",
        rollupTypes: true,
        exclude: [
          "*.config.*",
          "*.test.*",
          ...(dtsExcludes ?? []),
        ]},
      ),
      dts && dtsUseTsc && tscTypeDefsPlugin({args: dtsTscArgs}),
    ], plugins),
    ...other,
  });
}

export function nodeLib({dts = true, build: {rollupOptions: {output, ...otherRollupOptions} = defaultRollupOptions, ...otherBuild} = defaultBuild, ssr = {}, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return lib({
    dts,
    build: {
      // it's a hack but seems like the best option because "browser" module resolution does not
      // seem to be possible to disable otherwise.
      ssr: true,
      target: "esnext",
      minify: false,
      assetsInlineLimit: 0,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          ...output,
        },
        ...otherRollupOptions,
      },
      ...otherBuild,
    },
    ssr: {
      noExternal: true, // neccessary so that ssr inlines everything like browser build does
      ...ssr,
    },
    ...other,
  });
}

export function nodeCli({dts = false, build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return nodeLib({
    dts,
    build: {
      minify: "esbuild",
      ...build,
    },
    ...other,
  });
}

export function webLib({dts = true, build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return lib({
    dts,
    build: {
      target: "modules",
      minify: false,
      cssCodeSplit: true, // needed for css entry points
      assetsInlineLimit: 32768,
      ...build,
    },
    ...other,
  });
}

export function webApp({dts = false, build = defaultBuild, ...other}: CustomConfig = defaultConfig): ViteConfig {
  return base({
    dts,
    build: {
      target: "modules",
      minify: "esbuild",
      assetsInlineLimit: 32768,
      ...build,
    },
    ...other,
  });
}
