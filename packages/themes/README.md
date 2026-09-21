# @vitral/themes

The token engine behind [Vitral](https://www.npmjs.com/package/@vitral/vue),
and the presets that ship with it.

A preset has three layers: **primitive** (palettes, radii), **semantic**
(`primary.color`, `formField.borderColor`, with a `colorScheme: { light, dark }`
branch) and **component** tokens (`button.paddingX`). References such as
`'{primary.color}'` compile to `var(--vt-primary-color)`, so changing one token
re-colours everything built on it.

```ts
import { definePreset, palette, Prism } from '@vitral/themes';

export const Brand = definePreset(Prism, {
    semantic: { primary: palette('#7c3aed') },
    components: { button: { root: { borderRadius: '999px' } } }
});
```

A fourth, optional layer is **strongBorders**: the edges a preset draws when
asked to meet [WCAG
1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast). The
presets are drawn with quieter borders than the criterion wants, so both sets
compile — the stronger one into a block behind `[data-vt-borders="strong"]` —
and `borders: 'strong'` chooses between them without recompiling anything.

`createThemeManager()` runs a theme without any framework: it compiles the
preset into one `<style>` element, applies the dark and border selectors, and
tells subscribers when any of them change. The presets are **Prism** (default in the
docs), **Ink**, **Avalonia**, **Simple** and **Astra**. Compiled CSS for a page
that wants the look without the JavaScript is at `@vitral/themes/css/prism.css`.

**[Documentation](https://vitralui.github.io/vitral/#/docs/theming)**

LGPL-3.0-or-later. Part of the [Vitral](https://github.com/vitralui/vitral) monorepo.
