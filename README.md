# Vitral

A Vue 3 component library built around a token engine, so the whole look comes
from one object you can swap. Design tokens, presets, light and dark, per
instance overrides, pass-through attributes and a fully unstyled mode.

**[Documentation and live examples](https://vitralui.github.io/vitral/)**

The catalog covers the usual set of controls plus the pieces applications
actually need and most libraries leave out: charts, a scheduler, a task board,
a rich text editor, a command palette, and the layout panels (`StackPanel`,
`DockPanel`, `Grid` with star sizing, `SplitView`, `Splitter`).

Vue 3 is the first target. Everything that does not need a framework lives in
framework-free packages, so a React or Angular adapter later only has to write
the rendering.

The name is Portuguese for stained glass.

## Packages

| Package          | What it holds                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------- |
| `@vitral/core`   | Behaviour without a framework: focus trap, dismissable layer stack, positioning, z-index, list navigation and typeahead, the data layer (`FilterService`, `queryData`, `createDataSource`), trees, calendar maths, number formatting and parsing, locales (`en`, `pt-BR`) |
| `@vitral/themes` | The token engine (`definePreset`, `palette`, `compileTheme`, `createThemeManager`) and the presets **Prism**, **Ink**, **Avalonia** and **Simple** |
| `@vitral/styles` | Each component's CSS and class map, written against tokens, also shipped as one `vitral.css`                |
| `@vitral/icons`  | SVG icons as data                                                                                           |
| `@vitral/chart`  | SVG charts without a framework: the engine (options schema, scales, formats, scenes) and `createChart()`, a DOM renderer with legend, tooltip, toolbar, zoom, brush, keyboard walking and a live readout. The Vue `<Chart>` is a thin wrapper around it |
| `@vitral/forms`  | Form state and validation without a framework: nested paths, field arrays, built-in rules, async checks, and resolvers for Zod, Yup, Valibot, Superstruct or a plain function, with no dependency on any of them |
| `@vitral/vue`    | Components, composables, directives and the plugin                                                          |
| `@vitral/nuxt`   | The Nuxt module: configuration from `nuxt.config`, auto-imports, styles rendered on the server, the colour scheme in a cookie |

## Quick start (Vue)

```ts
import { createApp } from 'vue';
import { Vitral, Prism, ptBR } from '@vitral/vue';
import App from './App.vue';

createApp(App)
    .use(Vitral, {
        theme: { preset: Prism, colorScheme: 'system' },
        locale: ptBR
    })
    .mount('#app');
```

```vue
<script setup lang="ts">
import { Button, InputText, Select } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
const city = ref(null);
const cities = [{ name: 'São Paulo', code: 'SP' }, { name: 'Recife', code: 'REC' }];
</script>

<template>
    <label for="name">Name</label>
    <InputText id="name" v-model="name" clearable />

    <label for="city">City</label>
    <Select id="city" v-model="city" :options="cities" option-label="name" option-value="code" filter />

    <Button label="Save" icon="check" />
</template>
```

There is no stylesheet to import. The plugin injects the theme as CSS
variables, and each component injects its own CSS the first time it renders, so
a page only carries what it uses.

## Nuxt

```ts
export default defineNuxtConfig({
    modules: ['@vitral/nuxt'],
    vitral: { preset: 'Prism', colorScheme: 'system' }
});
```

That is the whole setup. `<VtButton>`, `<VtInputText>`, `useTheme()` and the
rest are auto-imported, the stylesheets go into the head of the page the server
sends, and the scheme is kept in a cookie so the server renders the one the
reader picked instead of flashing the wrong one. Set `prefix: ''` if you would
rather write `<Button>`. Directives keep their plain names (`v-tooltip`).

In a plain Vite app the same lists are available to unplugin-vue-components and
unplugin-auto-import:

```ts
import { VitralResolver, vitralAutoImports } from '@vitral/vue/resolver';

plugins: [Components({ resolvers: [VitralResolver()] }), AutoImport({ imports: [vitralAutoImports()] })];
```

## Server rendering (without Nuxt)

Collect the CSS the render used and put it in the head yourself:

```ts
const app = createSSRApp(App).use(Vitral, { theme: { storageKey: 'app-scheme' } });
const html = await renderToString(app);

const { tags } = collectStyles(app);       // the theme, then whatever rendered
const head = colorSchemeTag(app) + tags;   // marks <html> before the first paint
```

The style elements carry the same markers the browser writes, so hydration does
not inject a second copy, and ids come from Vue's `useId()`, which the client
matches. If the server already knows the scheme, drop the script and render
`colorSchemeAttrs(dark)` on `<html>`.

## Forms

Forms are built from parts: `Form.Root`, `Form.Field`, `Form.Summary`,
`Form.Submit` and so on (also exported as `FormRoot`, `FormField`…). A field
binds the Vitral control placed inside it, including the label, hint and error
relations.

```vue
<script setup lang="ts">
import { Form, InputText, rules } from '@vitral/vue';

const save = async (values: Record<string, unknown>) => {
    await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(values) });
};
</script>

<template>
    <Form.Root :initial-values="{ email: '' }" @submit="(e) => e.valid && save(e.values)">
        <Form.Summary />
        <Form.Field name="email" label="Email" required :rules="rules.email()">
            <InputText type="email" />
        </Form.Field>
        <Form.Submit label="Subscribe" />
    </Form.Root>
</template>
```

Errors appear once a field has been validated (on submit by default;
`validate-on` also takes `blur`, `change` or `input`), and a failed submit moves
focus to the summary or the first invalid field. Use
`:resolver="zodResolver(schema)"` to hand validation to a schema, or `useForm()`
to drive the same form from a script.

## Theming

A preset has three layers: **primitive** (palettes, radii), **semantic**
(`primary.color`, `formField.borderColor`, with a `colorScheme: { light, dark }`
branch) and **component** tokens (`button.paddingX`). References like
`'{primary.color}'` compile to `var(--vt-primary-color)`, so changing one token
re-colours everything built on it.

```ts
import { definePreset, Prism } from '@vitral/vue';

const Brand = definePreset(Prism, {
    semantic: { primary: palette('#7c3aed') },
    components: { button: { root: { borderRadius: '999px' } } }
});
```

At runtime `useTheme()` switches preset, scheme and primary colour:

```ts
const { setPreset, setColorScheme, toggleDark, setPrimary, isDark } = useTheme();
setPrimary('{emerald}');
```

- **Prism** (default): the web-native look. Coloured primary, medium corners,
  soft shadows, a halo focus ring.
- **Ink**: quiet and high contrast. Zinc surfaces, hairline borders, a
  near-black primary, focus ring offset from the control.
- **Avalonia**: the desktop look. Accent blue, translucent control fills, a 2px
  accent line under a focused text box, an accent pill on selected items.
- **Simple**: square, compact, no shadows or animation, 13px type.

Per instance, `dt` overrides tokens and `pt` passes attributes or classes to any
part. `unstyled` drops every built-in class:

```vue
<Button label="Tailwind" unstyled :pt="{ root: 'px-4 py-2 rounded bg-violet-600 text-white' }" />
<Button label="Square" :dt="{ button: { borderRadius: '0' } }" />
```

Without JavaScript, `@vitral/themes/css/prism.css` and
`@vitral/styles/vitral.css` theme a page with two `<link>`s.

## Accessibility

Every component ships with its WAI-ARIA pattern (roles, names, states,
relations and keyboard) and a spec that runs axe over it and drives its keys.
A component is not considered done without it.

## Developing

```sh
pnpm install
pnpm dev            # the documentation site at http://localhost:5180
pnpm dev:playground # the bare control catalog at http://localhost:5181
pnpm dev:nuxt       # the Nuxt playground
pnpm test           # vitest + axe
pnpm typecheck
pnpm build
pnpm check:nuxt     # runs the Nuxt playground and checks the server render
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how a component is put together.

## Licence

LGPL-3.0-or-later. You can use Vitral in a closed-source application; changes
to Vitral itself have to stay under the same licence, and your users have to be
able to replace it with their own build. See [LICENSE](LICENSE) (and
[LICENSE.GPL](LICENSE.GPL), which the LGPL refers to).
