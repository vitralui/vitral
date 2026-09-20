<div align="center">

# Vitral

**A Vue 3 component library built around a token engine — the whole look comes from one object you can swap.**

[![Docs](https://img.shields.io/badge/docs-vitralui.github.io-2563eb?style=for-the-badge)](https://vitralui.github.io/vitral/)
[![npm](https://img.shields.io/npm/v/@vitral/vue?style=for-the-badge&color=2563eb&label=%40vitral%2Fvue)](https://www.npmjs.com/package/@vitral/vue)
[![licence](https://img.shields.io/badge/licence-LGPL--3.0--or--later-2563eb?style=for-the-badge)](https://github.com/vitralui/vitral/blob/main/LICENSE)

</div>

---

Most libraries give you the controls and stop where the work starts. Vitral
covers the usual buttons and fields **and** the pieces applications actually
need: charts, a data grid, a scheduler, a task board, a spreadsheet, a rich
text editor and a chat.

```sh
pnpm add @vitral/vue
```

```ts
import { createApp } from 'vue';
import { Vitral, Prism } from '@vitral/vue';

createApp(App).use(Vitral, { theme: { preset: Prism, colorScheme: 'system' } }).mount('#app');
```

No stylesheet to import. The plugin injects the theme as CSS variables, so
light and dark, a brand colour or a whole redesign are one object away.

---

## What is in it

<table>
<tr><td><b>183</b><br>components</td><td><b>16</b><br>packages</td><td><b>104</b><br>live demos</td><td><b>3300+</b><br>tests</td></tr>
</table>

**The controls** — inputs, selects, date pickers, dialogs, menus, tables,
toasts, a command palette, layout panels. The ones you expect, with the
keyboard and the ARIA the specification asks for rather than the ones that were
easy.

**The addons** — the heavy pieces, each written as plain TypeScript that draws
itself. No framework inside any of them:

| | |
| --- | --- |
| [`@vitral/chart`](https://vitralui.github.io/vitral/charts/) | Twenty-odd kinds, zoom, brushes, synced groups, an options object shaped like ApexCharts' |
| [`@vitral/datagrid`](https://vitralui.github.io/vitral/components/datagrid/) | Sort, filter, page, select, and columns the reader resizes, reorders and freezes |
| [`@vitral/schedule`](https://vitralui.github.io/vitral/components/schedule/) | Month, week, day, agenda and a resource timeline, with recurrence and drag to move |
| [`@vitral/taskboard`](https://vitralui.github.io/vitral/components/taskboard/) | Columns, swimlanes, WIP limits and drag and drop that works from the keyboard |
| [`@vitral/spreadsheet`](https://vitralui.github.io/vitral/components/spreadsheet/) | A formula engine, A1 references and a dependency graph |
| [`@vitral/editor`](https://vitralui.github.io/vitral/components/editor/) | Rich text with a slash menu and block actions |
| [`@vitral/chat`](https://vitralui.github.io/vitral/components/chat/) | Threads, streaming answers, and the tools an agent reached for |
| [`@vitral/forms`](https://vitralui.github.io/vitral/components/form/) | Values, validation and submit state |

Because an addon has no framework in it, the same chart can be drawn by Vue, by
React, by Angular, or by a page with no framework at all:

```ts
import { createChart } from '@vitral/chart';

const chart = createChart(element, { type: 'bar', series, options });
```

---

## Why it is built this way

**One object decides the look.** Every colour, radius and space a component
draws is a token. A preset swaps all of them at once; `dt` overrides them for a
single instance. There is no stylesheet to fight.

**Accessibility is the default, not a prop.** A grid is a real `<table>` with
scoped headers. A chart takes focus and reads itself point by point. A chat log
is one tab stop with the arrows moving inside it. Drag and drop works from the
keyboard, and every step is announced.

**Options survive JSON.** A chart's configuration is plain data, so it can be
stored, sent over the wire, or written by a visual editor.

**It works before the JavaScript does.** Server rendering, Nuxt, and a
prerendered documentation site of 134 pages.

---

<div align="center">

### [Read the documentation →](https://vitralui.github.io/vitral/)

Every component, live, with the API and the source of each example.

</div>
