# @vitral/core

The behaviour behind [Vitral](https://www.npmjs.com/package/@vitral/vue), with
no framework in it. The Vue components use this, and a React or Angular adapter
would use the same functions.

- Accessibility: focus trap, roving tabindex, list, tree and menu navigation, typeahead, live-region helpers.
- Overlays: a dismissable layer stack (Escape and press-outside reach only the topmost layer), positioning over Floating UI, z-index, scroll lock.
- Data: `FilterService`, `sortData`, `queryData`, `createDataSource` for local and remote data, selection, trees, paging, virtualisation.
- Dates and numbers: calendar maths, RRULE recurrence, scheduler layout, locale-aware formatting **and parsing**.
- Text editing: the document model, commands and HTML/Markdown/JSON formats behind the Editor.
- Locales: `en` and `pt-BR`.

```sh
pnpm add @vitral/core
```

**[Documentation](https://vitralui.github.io/vitral/)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
