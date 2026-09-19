# Vitral

[![CI](https://github.com/vitralui/vitral/actions/workflows/ci.yml/badge.svg)](https://github.com/vitralui/vitral/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vitral/vue?color=%232563eb&label=%40vitral%2Fvue)](https://www.npmjs.com/package/@vitral/vue)
[![licence](https://img.shields.io/badge/licence-LGPL--3.0--or--later-blue)](LICENSE)

A Vue 3 component library built around a token engine, so the whole look comes
from one object you can swap. The catalog covers the usual controls plus the
pieces applications need and most libraries leave out: charts, a scheduler, a
task board, a rich text editor, a command palette and layout panels.

### **[vitralui.github.io/vitral](https://vitralui.github.io/vitral/)** — documentation, live examples and the API of every component

```sh
pnpm add @vitral/vue
```

```ts
import { createApp } from 'vue';
import { Vitral, Prism } from '@vitral/vue';
import App from './App.vue';

createApp(App).use(Vitral, { theme: { preset: Prism, colorScheme: 'system' } }).mount('#app');
```

```vue
<script setup lang="ts">
import { Button, InputText } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
</script>

<template>
    <InputText v-model="name" clearable />
    <Button label="Save" icon="check" />
</template>
```

No stylesheet to import: the plugin injects the theme as CSS variables, and
each component injects its own CSS the first time it renders. On Nuxt, add
`'@vitral/nuxt'` to `modules` and skip the plugin call.

## The packages

| Package | |
| --- | --- |
| [`@vitral/vue`](https://www.npmjs.com/package/@vitral/vue) | Components, composables, directives and the plugin |
| [`@vitral/nuxt`](https://www.npmjs.com/package/@vitral/nuxt) | The Nuxt module: auto-imports, server-rendered styles, the scheme in a cookie |
| [`@vitral/core`](https://www.npmjs.com/package/@vitral/core) | Behaviour with no framework in it: accessibility, overlays, the data layer, dates, numbers |
| [`@vitral/themes`](https://www.npmjs.com/package/@vitral/themes) | The token engine and the presets |
| [`@vitral/styles`](https://www.npmjs.com/package/@vitral/styles) | Every component's CSS and class map |
| [`@vitral/icons`](https://www.npmjs.com/package/@vitral/icons) | The icon set, as data |
| [`@vitral/dom`](https://www.npmjs.com/package/@vitral/dom) | What the framework-free packages render with: a keyed patcher, parts and pass-through, pointer drags |
| [`@vitral/controls`](https://www.npmjs.com/package/@vitral/controls) | The select, the menu and the anchored panel those packages need, wearing the same styles |
| [`@vitral/chart`](https://www.npmjs.com/package/@vitral/chart) | The chart: scales, the scene and its SVG renderer |
| [`@vitral/datatable`](https://www.npmjs.com/package/@vitral/datatable) | The data table: sorting, filtering, paging, selection, the column layout, and a real `<table>` |
| [`@vitral/schedule`](https://www.npmjs.com/package/@vitral/schedule) | The calendar and scheduler: views, periods, recurrence, layout |
| [`@vitral/taskboard`](https://www.npmjs.com/package/@vitral/taskboard) | The task board: lanes, moves, limits, and drag and drop a keyboard can do |
| [`@vitral/editor`](https://www.npmjs.com/package/@vitral/editor) | The rich text editor's interface: toolbar, panels, the slash menu and the block handle |
| [`@vitral/spreadsheet`](https://www.npmjs.com/package/@vitral/spreadsheet) | The spreadsheet: cells, A1 references, formulas and the graph between them |
| [`@vitral/forms`](https://www.npmjs.com/package/@vitral/forms) | Form state, validation and schema resolvers |

Vue 3 is the first target. Everything that does not need a framework lives in
the packages that do not import one, so a React or Angular adapter only has to
write the rendering.

The seven at the bottom of that table go further: they draw themselves. A
chart, a data table, a scheduler, a task board, a rich text editor, a
spreadsheet and a form's rules are months of work each and none of it is about
a framework, so each is an engine in plain TypeScript and, where something is
drawn, a renderer that draws it into an element you hand it. `<Chart>`,
`<DataTable>`, `<Schedule>`, `<Taskboard>`, `<Editor>` and `<Spreadsheet>` are
wrappers over them, and a page with no framework at all calls
`createChart(element, …)` itself.

## Reading

- [Installation](https://vitralui.github.io/vitral/docs/installation/), [theming](https://vitralui.github.io/vitral/docs/theming/), [colour schemes](https://vitralui.github.io/vitral/docs/dark-mode/), [pass-through](https://vitralui.github.io/vitral/docs/pass-through/), [unstyled mode](https://vitralui.github.io/vitral/docs/unstyled/), [server rendering and Nuxt](https://vitralui.github.io/vitral/docs/server-rendering/).
- [Every component](https://vitralui.github.io/vitral/components/button/), with live examples, the markup behind each one and an API table read from its source.
- [Templates](https://vitralui.github.io/vitral/templates/): whole applications built from these components.
- For coding agents: [`llms.txt`](https://vitralui.github.io/vitral/llms.txt), [`llms-full.txt`](https://vitralui.github.io/vitral/llms-full.txt), or any page as Markdown by adding `.md` to its URL.

## Developing

```sh
pnpm install
pnpm dev            # the documentation site at http://localhost:5180
pnpm dev:playground # the bare control catalog at http://localhost:5181
pnpm dev:nuxt       # the Nuxt playground
pnpm test           # vitest + axe
pnpm typecheck
pnpm build
pnpm check:nuxt     # the Nuxt playground's server render and hydration
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers how a component is put together, what
each package holds and what the checks are.

## Licence

LGPL-3.0-or-later. You can use Vitral in a closed-source application; changes
to Vitral itself stay under the same licence, and your users have to be able to
replace it with their own build. See [LICENSE](LICENSE) and
[LICENSE.GPL](LICENSE.GPL).
