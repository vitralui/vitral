# Contributing

## How the repository is laid out

| Package                | Holds                                                                                          | Framework |
| ---------------------- | ---------------------------------------------------------------------------------------------- | --------- |
| `@vitral/core`         | Utilities, accessibility helpers, overlays, the data layer, dates, numbers, locales             | none      |
| `@vitral/themes`       | The token engine and the presets (Ink, Prism, Avalonia, Simple, Astra)                          | none      |
| `@vitral/styles`       | Every component's CSS and class map, written against tokens                                     | none      |
| `@vitral/icons`        | SVG icon data                                                                                   | none      |
| `@vitral/forms`        | Form state, validation rules, async checks, field arrays and schema resolvers                    | none      |
| `@vitral/chart`        | The chart: engine, DOM renderer (`createChart`), class map and CSS                              | none      |
| `@vitral/vue`          | Components, composables, directives, the plugin                                                 | Vue       |
| `@vitral/nuxt`         | The Nuxt module: configuration, auto-imports, server-rendered styles, the scheme cookie         | Nuxt      |
| `apps/docs`            | The documentation site                                                                          | Vue       |
| `apps/playground`      | The bare control catalog, over the same demo pages                                              | Vue       |
| `apps/nuxt-playground` | A Nuxt app over the module, for trying server rendering and hydration for real                  | Nuxt      |

Anything that can be written without a framework is. A React or Angular adapter
later reuses the behaviour (core), the look (themes, styles) and the markup
contract (the class maps in styles), and only writes the rendering.

The chart goes further and draws its own DOM in `@vitral/chart`
(`createChart(element, …)` returns a handle with `update`, `on` and `destroy`).
Each framework's `<Chart>` passes props and configuration in, maps its slots
onto the renderer's hooks (`tooltip.render`, `legend.item`, `noData.render`,
`center.render`) and turns the renderer's events into its own. The engine
specs, the renderer specs (jsdom, against `createChart` directly) and the
stylesheet live in that package; the Vue spec only tests the wrapping.

## Adding a component

A component called `ToggleSwitch` has the token and style name `toggleswitch`:
lower case, no dashes. It is five pieces.

1. **Tokens**, in
   `packages/themes/src/presets/base/components/toggleswitch.ts`, default
   exporting a token tree. Values should refer to the semantic layer
   (`'{formField.borderColor}'`, `'{primary.color}'`, `'{control.minHeight}'`);
   a raw colour is a last resort. Anything that differs between light and dark
   goes under `colorScheme: { light, dark }`. Every token becomes
   `--vt-toggleswitch-…`, with a `root` segment dropped from the name.

2. **Style**, in `packages/styles/src/toggleswitch/toggleswitch.css` plus an
   `index.ts` exporting
   `toggleswitchStyle = defineStyle({ name: 'toggleswitch', css, classes })`.
   - Classes are `vt-toggleswitch`, `vt-toggleswitch-<part>` and
     `vt-toggleswitch-<modifier>`.
   - CSS reads only `var(--vt-…)`. No hard-coded colours, radii or durations.
   - Build on the shared chrome in `base/base.css` instead of restyling it:
     `.vt-field` (plus `fieldClasses()`) for anything text-like, `.vt-overlay`
     for popup panels, `.vt-option` (plus `optionClasses()`) for list items,
     `.vt-mask` for modal backdrops, and the `vt-overlay` / `vt-fade`
     transitions.
   - Keyboard focus shows the focus ring on `:focus-visible`:
     `outline: var(--vt-focus-ring-width) var(--vt-focus-ring-style) var(--vt-focus-ring-color); outline-offset: var(--vt-focus-ring-offset);`
   - Anything that animates also stops under `prefers-reduced-motion: reduce`.

3. **The Vue component**, in `packages/vue/src/components/ToggleSwitch/`:
   - `types.ts` with the props interface, extending `BaseProps`. Prop types come
     from `../../base/types` (`IconProp`, `Severity`, `Size`, `InputVariant`,
     `OverlayPlacement`) or are written inline, never imported from another
     `@vitral/*` package, because the SFC compiler has to be able to read them.
   - `ToggleSwitch.vue`, using `<script setup lang="ts">` with
     `defineOptions({ name: 'VtToggleSwitch' })` and
     `withDefaults(defineProps<ToggleSwitchProps>(), { unstyled: undefined, … })`.
     `unstyled: undefined` is required, and so is `variant: undefined` on
     field-like components: Vue turns an absent boolean prop into `false`, which
     would override the global setting. Every element carries
     `v-bind="part('partName', state)"`, which is what makes the component
     themeable, restylable through pass-through and usable unstyled.
   - `index.ts`:
     `export { default as ToggleSwitch } from './ToggleSwitch.vue'; export type * from './types';`
   - `ToggleSwitch.spec.ts`, see *Accessibility* below.

4. **A demo**, in `apps/docs/src/demos/ToggleSwitch.vue`, exporting
   `meta: DemoMeta` from a plain `<script>` block. The site finds it by glob and
   reads the same file again as text, so the code shown next to each example
   cannot drift from what is running above it.

5. **Barrels**: run `pnpm gen`. Nobody edits the `index.ts` lists by hand. It
   also writes `components/manifest.ts`, the list of every component,
   composable and directive by name, which is what the Nuxt module and the
   unplugin resolver register from. A build tool cannot import `.vue` files to
   ask.

Composables a component brings (`useToast`) go in
`packages/vue/src/composables/useToast.ts`, directives in
`packages/vue/src/directives/<name>.ts`. `pnpm gen` lists them.

### Conventions

- `v-model` through `defineModel()`.
- A component whose root wraps a native control uses `useSplitAttrs()` with
  `inheritAttrs: false`: `class` and `style` dress the wrapper, every other
  attribute reaches the control, so `<label for>`, `aria-describedby` and `name`
  work without extra props.
- Text comes from the locale (`const { locale } = useComponent(...)`). Add keys
  to `Locale` in `packages/core/src/locale/locale.ts`, in both `en` and `ptBR`.
- Ids come from Vue's `useId()`.
- Popups use `<Teleport :to="overlayTarget">` with
  `const overlayTarget = useOverlayTarget(() => props.appendTo)` (so an
  `<OverlayScope>`, a preview in another theme, receives them),
  `<Transition name="vt-overlay">`, and `useOverlay()` for positioning,
  stacking and dismissal. Modals add `useFocusTrap()`, `lockScroll()` and the
  `modal` z-index key.
- Behaviour with no DOM in it (navigation, parsing, selection) goes in
  `@vitral/core`, with a test there.
- Reach for an option before a new component. Two things that differ only in
  what they refuse are one thing with a prop.

## Adding an icon

Icons live in `packages/icons/src/icons/<category>.ts`, one file per category
listed in `packages/icons/src/categories.ts`. Each is an object literal,
`{ name, category, tags, body }`, exported under its own camelCase name so a
bundler keeps only the icons an application imports.

- Draw on the 24×24 grid as an outline, using `path`, `circle`, `ellipse`,
  `rect`, `line`, `polyline` and `polygon` only. No `stroke`, `transform` or
  colours of their own (`fill="currentColor"` only for a deliberately solid
  part). The `<svg>` supplies the 2-unit round stroke.
- Keep about 2 units of margin (geometry within 1–23), give rectangles a 2-unit
  corner radius, and draw the geometry yourself.
- Add English `tags` for the docs search.
- Run `pnpm gen` (it regenerates `icons/index.ts` and `icons/all.ts`), then the
  icon specs: they parse every icon, check its elements and bounds, and check
  that every icon name used in the repository exists. A name a component uses
  must also be in `baseIcons` (`packages/icons/src/runtime.ts`), which is what
  resolves without registration.

## Accessibility

A component is not done until its accessibility works. That means the role, an
accessible name, every state and value that applies (`aria-checked`,
`aria-expanded`, `aria-selected`, `aria-valuenow`…), the relations tying it to
its label, description and popup, and the keyboard behaviour of the matching
[WAI-ARIA APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/).

So every spec:

- calls `expectNoA11yViolations()` (axe) on the representative states, and for
  an overlay both closed and open;
- drives the keyboard (`press()` from `test/utils.ts`) through the pattern's
  keys and asserts what changes;
- asserts the ARIA attributes, not only the classes.

## Rendering on a server

Nothing may touch `document` while a component sets itself up, because a page
is rendered on a server before it is ever hydrated. `isClient` guards what
does, and a component's stylesheet, which the browser injects on first render,
is collected instead, into the registry on the Vitral context, for
`collectStyles(app)` to write into the head. A new component needs nothing
extra as long as it takes its styles through `useComponent` and its ids through
`useId()`.

A spec that wants the server renders there: `// @vitest-environment node` at the
top of the file and `renderToString` from `vue/server-renderer`, with no jsdom.
`packages/vue/src/ssr.spec.ts` is the example.

A component that can only be drawn in a browser should still render its element
on the server and fill it on mount, which is what the chart does and it hydrates
cleanly. Holding the markup back until after `mounted` does the opposite: the
component's `mounted` runs with no element to work on.

`apps/nuxt-playground` is where the whole path is tried at once: server render,
hydration, auto-imports and the scheme cookie. It reads the packages' `dist`, so
`pnpm dev:nuxt` builds them first, and `pnpm check:nuxt` runs it and asserts all
of that without anyone watching.

## Checks

```sh
pnpm test                          # vitest + axe
pnpm typecheck                     # vue-tsc over every package and app
node scripts/gen-index.mjs --check # barrels up to date
pnpm build                         # every package builds, with declarations
pnpm check:nuxt                    # server render and hydration, in the Nuxt playground
```
