import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
import {builtinModules} from "node:module";
import {stringPlugin} from "vite-string-plugin";
import {dtsPlugin, type ViteDtsPluginOpts} from "vite-dts-plugin";
import type {Plugin, UserConfig as ViteConfig, PluginOption} from "vite";

const uniquePluginName = (plugin: Plugin): string => {
  const apply = typeof plugin.apply === "string" ? plugin.apply : "";
  return `${plugin.name}-${apply}-${String(plugin.enforce)}`;
};

type CustomConfig = ViteConfig & {
  /** The value of import.meta.url from your config file */
  url: string,
  /** Whether to generate type definitions */
  dts?: boolean,
  /** Options passed to vite-dts-plugin */
  dtsOpts?: ViteDtsPluginOpts,
  /** Additional exclude patterns passed to vite-dts-plugin */
  dtsExcludes?: Array<string>,
  /** Replace instead of append to rollupOptions.external */
  replaceExternal?: boolean,
};


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

// TODO: dtsExcludes does not work, for example in repo eslint-config-silverwind
export function makeExcludes(dtsExcludes: Array<string>): string {
  return `{
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
${dtsExcludes.map(str => `      "\${configDir}/${str}"`).join(`,\n`)}
    ],
  }`;
}

// avoid vite bug https://github.com/vitejs/vite/issues/3295
const libEntryFile = "index.ts";

function lib({url, dts = true, dtsOpts, dtsExcludes = [], build: {lib = false, rollupOptions: {external = [], ...otherRollupOptions} = defaultRollupOptions, ...otherBuild} = defaultBuild, plugins = [], replaceExternal = false, ...other}: CustomConfig = defaultConfig): ViteConfig {
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
        external: replaceExternal ? external : [
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
      dts && dtsPlugin({tsConfig: makeExcludes(dtsExcludes), ...dtsOpts}),
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
      target: "node22",
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
      minify: "esbuild",
      assetsInlineLimit: 32768,
      ...build,
    },
    ...other,
  });
}
