# vite-config-silverwind [![](https://img.shields.io/npm/v/vite-config-silverwind.svg)](https://www.npmjs.org/package/vite-config-silverwind) [![](https://packagephobia.com/badge?p=vite-config-silverwind)](https://packagephobia.com/result?p=vite-config-silverwind) [![](https://img.shields.io/badge/licence-bsd-blue.svg)](https://raw.githubusercontent.com/silverwind/vite-config-silverwind/master/LICENSE)

Shared vite configuration

```js
import {defineConfig} from "vite";
import {nodeLib} from "vite-config-silverwind";

export default defineConfig(nodeLib({url: import.meta.url}));
```

© [silverwind](https://github.com/silverwind), distributed under BSD licence.
