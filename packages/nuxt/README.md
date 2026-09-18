# @vitral/nuxt

The Nuxt module for [Vitral](https://www.npmjs.com/package/@vitral/vue).

```sh
pnpm add @vitral/nuxt @vitral/vue
```

```ts
export default defineNuxtConfig({
    modules: ['@vitral/nuxt'],
    vitral: { preset: 'Prism', colorScheme: 'system' }
});
```

That is the whole setup. `<VtButton>`, `<VtInputText>`, `useTheme()` and the
rest are auto-imported, the stylesheets go into the head of the page the server
sends, and the colour scheme is kept in a cookie so the server renders the one
the reader picked instead of flashing the wrong one.

| Option | What it does |
| ------ | ------------ |
| `preset` | A shipped preset by name (`'Prism'`, `'Ink'`, `'Avalonia'`, `'Simple'`, `'Astra'`), a module that default-exports one, or `false` |
| `colorScheme` | `'light'`, `'dark'` or `'system'` |
| `cookie` | Where the reader's choice is kept, so the server can read it. `false` forgets it |
| `darkModeSelector` | Where the dark scheme applies: a class, an attribute, `'system'` or `false` |
| `locale` | `'en'`, `'ptBR'`, or a module that default-exports a locale |
| `prefix` | The prefix on registered components. `'Vt'` by default, `''` for `<Button>` |
| `components`, `composables` | Register them globally. Off means importing by hand |
| `cssLayer`, `inputVariant`, `unstyled` | The same options the Vue plugin takes |

Directives keep their plain names (`v-tooltip`), because they are registered on
the application rather than auto-imported.

**[Documentation](https://vitralui.github.io/vitral/#/docs/server-rendering)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
