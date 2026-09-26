# vite-config-silverwind
[![](https://img.shields.io/npm/v/vite-config-silverwind.svg)](https://www.npmjs.org/package/vite-config-silverwind) [![](https://packagephobia.com/badge?p=vite-config-silverwind)](https://packagephobia.com/result?p=vite-config-silverwind)

> Shared vite configuration

## Usage

```sh
pnpm add -D vite-config-silverwind
```

In `vite.config.ts`:

```ts
import {defineConfig} from "vite";
import {nodeLib} from "vite-config-silverwind";

export default defineConfig(nodeLib({url: import.meta.url}));
```

© [silverwind](https://github.com/silverwind), distributed under BSD licence
