# Roadmap

Where the library stands and what is next. Kept up to date as things land,
otherwise it stops being worth reading.

## 0.1: foundation

Done:

- Monorepo: pnpm, TypeScript 5.9 (pinned through `pnpm.overrides`), Vite 8,
  Vitest 5 with jsdom and axe-core.
- `@vitral/core`: object utilities and `cn`, focus trap, dismissable layer
  stack (Escape and press-outside only reach the topmost layer), Floating UI
  positioning, z-index manager, scroll lock, list navigation and typeahead, the
  data layer (`FilterService`, accent and case insensitive, `sortData`,
  `queryData`, `createDataSource` for local and remote data), selection
  helpers, tree helpers (flatten, checkbox propagation, filter), calendar maths
  with `formatDate`/`parseDate`, locale-aware number formatting and parsing,
  and the `en` and `pt-BR` locales.
- `@vitral/themes`: primitive → semantic → component tokens, with `{ref}`
  references compiled to `var()`, light and dark schemes (class, attribute or
  system), `definePreset`, `palette()`, `updatePrimaryPalette`,
  `createThemeManager`, and the presets Prism (default), Ink, Avalonia and
  Simple.
- `@vitral/styles`: shared chrome (`.vt-field`, `.vt-overlay`, `.vt-option`,
  `.vt-mask`, transitions), per-component CSS and class maps, and `vitral.css`.
- `@vitral/icons`: 49 icons as data, plus `renderSvg`.
- `@vitral/chart`: the engine (options schema and defaults, scales, formats,
  scene building, hit testing, the group bus, text alternatives) and
  `createChart()`, a DOM renderer with legend, tooltip, toolbar and download
  menu, zoom, pan, wheel, brush, groups, keyboard walking, live readout, a
  hidden data table, SVG/PNG/CSV export, hooks for custom tooltip, legend,
  empty and centre content, plus pass-through and unstyled.
- `@vitral/vue`: the plugin, reactive config, `useComponent` (styles, classes,
  pass-through with string shorthand, per-instance `dt` tokens, unstyled),
  `useTheme`, `useLocale`, `useOverlay`, `useFocusTrap`.
- `apps/docs`: landing page, guides, a page per component with live examples,
  the markup behind each one (read from the demo file itself) and an API table
  generated from the component's `types.ts`, and a page per theme showing the
  kind of application it was drawn for. Preset, scheme, field variant, locale
  and primary colour switches live in the bar, `?scheme=` and `?preset=` make
  screenshots deterministic, and Ctrl-K searches components and guides.
- `apps/playground`: the bare control catalog, over the same demo pages.

## 0.1: components

The full table, with what is shipped and what each missing one is for, is
generated from `apps/docs/src/lib/backlog.ts`.

Done, by group:

- Form: AutoComplete, MultiSelect, Password, InputMask, InputOtp, SelectButton,
  ToggleButton, Rating, Knob, ColorPicker, TreeSelect, CascadeSelect,
  FloatLabel / IftaLabel, InputGroup, IconField, Label.
- Button: SplitButton, ButtonGroup, SpeedDial.
- Data: TreeTable, DataView, VirtualScroller, OrderList, PickList, Timeline,
  OrganizationChart.
- Panel and menu: Fieldset, ScrollPanel, Stepper, TieredMenu, Menubar,
  ContextMenu, PanelMenu, MegaMenu, Dock, Sidebar.
- Overlay: ConfirmPopup, HoverCard, DynamicDialog (`useDialog`).
- Misc and media: Avatar, Skeleton, Chip, MeterGroup, Image, Galleria, Carousel,
  FileUpload, ScrollTop, Inplace, BlockUI, AspectRatio, Terminal, Command.
- Application pieces: Taskboard (columns and swimlanes, drag and drop by
  pointer, touch or keyboard with announcements, column reordering,
  work-in-progress limits, collapsing, locked cards, `canDrop`), Schedule
  (month, week, day, agenda and resource timeline, overlap layout, RRULE
  recurrence with EXDATE, drag to move, resize and select with keyboard
  equivalents, `event-change` with `revert()`, "+N more") and Chart (line,
  area, bar, lollipop, scatter, bubble, heat map, candlestick, pie, donut,
  radar, sparklines, with nice scales, datetime axes, shared tooltip, legend
  toggles, zoom and pan, SVG/PNG/CSV export, brush, synced groups and
  annotations). The maths behind the first two lives in core; the chart,
  rendering included, is `@vitral/chart`, and the Vue `<Chart>` only wraps it.
- Editor: a rich text editor with its own editing engine and no dependency.
  Document model, pure commands with grouped undo, Markdown input rules,
  HTML (sanitising parser), JSON, Markdown and text formats, and a
  `contenteditable` view driven by `beforeinput`, with IME and uncancellable
  input read back from the DOM. All of it in `@vitral/core/editor`. The Vue
  component is composed from parts (`Editor.Root`, `Editor.Toolbar`,
  `Editor.Button`, `Editor.Content`, `Editor.BubbleMenu`…) sharing one editor
  through `useEditor()`, with the APG toolbar pattern, a link popover
  (Ctrl/Cmd+K), palette colours and highlights, images by URL with required alt
  text, tables, task lists and a word/character count with `maxLength`.
- Forms: `@vitral/forms` is framework-free and has no dependencies. Values with
  nested and array paths, dirty/touched/validated state per field, submit
  state, validation on submit, blur, change or input (per form and per field,
  with debounce and revalidation after the first check), async rules with stale
  runs aborted, cross-field checks, field arrays that carry their items' state,
  built-in rules with texts from the locale, and resolvers for Zod, Yup,
  Valibot, Superstruct, Standard Schema or a plain function. The Vue side is
  compound like the Editor: `Form.Root` (a native `<form novalidate>`),
  `Form.Field`, `Form.Label`, `Form.Description`, `Form.Message`,
  `Form.Summary`/`Form.Errors` (the GOV.UK error summary, focused on a failed
  submit), `Form.Submit`, `Form.Reset` and `Form.FieldArray`, plus `useForm()`
  and `useFormField()`.
- The `chart` token namespace is shared: the semantic palette is `chart.1` to
  `chart.8`, the Chart component's tokens use named keys only, and
  `tokenCollisions()` checks every preset for a property two layers declare.
- Submenus, mega-menu panels and cascade columns are positioned with
  `position: fixed` through Floating UI, so an ancestor's overflow cannot clip
  them and they flip at the window edge.

Still open:

- Forms: binding FileUpload (no `v-model` yet); a field whose control sits in
  another component's slot binds the first control of that slot rather than of
  the whole field; a live test of the announcements with NVDA, JAWS and
  VoiceOver.
- Editor: text alignment, sub/superscript, table cell selection and merged
  cells, resizable images and image upload, dragging content inside the editor,
  and testing IME and mobile on real devices.
- Chart: a visual options editor on the site (walking `chartOptionsSchema`),
  range bars, logarithmic axes, and a theme editor page for the component
  tokens.
- Schedule: time zones (dates are local today and conversion is the
  application's job), editing a whole recurring series from a drag, and
  virtualised resource rows for large timelines.
- Virtual scrolling inside Select, Listbox and DataTable (VirtualScroller is
  there to build on), APG grid keyboard navigation for DataTable, closable
  tabs, and RepeatButton behaviour as an option on Button.
- The Ctrl-K palette on the site is still hand-written; it could move onto
  `CommandDialog`.

## Framework adapters

The split that makes these cheap is already in place: behaviour in core, look
in themes and styles, markup contract in the class maps.

- `@vitral/react`: a `useComponent` hook mirroring the Vue one (same `classOf`,
  same pass-through merge), a provider around `createThemeManager`, and
  components written against the same class maps and core helpers.
- `@vitral/angular`: signals-based components over the same packages.
- The chart is already shared whole, so both `<Chart>` wrappers are thin:
  create on mount, `update()` on input changes, `destroy()` on unmount, forward
  the events, pass the locale, and render slots or templates into the nodes the
  renderer's hooks return.
- Worth deciding before starting either: whether Select, Tree and DatePicker
  should become framework-free state machines in core, so the adapters share
  the keyboard handling too and not only its helpers.

## Server rendering and Nuxt

Done:

- SSR. A render without a document collects the stylesheets it asks for instead
  of injecting them (`createStyleRegistry` in core, one registry per Vitral
  context). `collectStyles(app)` returns the theme plus whatever rendered, as
  CSS, as `<style>` tags or as entries for a head manager, carrying the
  plugin's nonce and CSS layer and the markers that stop hydration injecting a
  second copy. `colorSchemeTag(app)` writes the script that marks `<html>`
  before the first paint, and `colorSchemeAttrs(dark)` covers the case where
  the server already knows the scheme. `parseDarkModeSelector` is the only
  reader of `darkModeSelector`, so the script, the server and the theme manager
  cannot disagree. Ids already came from Vue's `useId()`. Specs run through
  `@vue/server-renderer` in a Node environment.
- `@vitral/nuxt`. `modules: ['@vitral/nuxt']` plus a `vitral` key in
  `nuxt.config`. The preset and locale are imported by name in a generated
  module, since a config file carries data and not objects. Components are
  registered under a prefix (`VtButton`, or `Button` with `prefix: ''`),
  composables are auto-imported and directives are registered on the app, all
  from `@vitral/vue/manifest`, which `pnpm gen` writes because a build tool
  cannot import `.vue` files to ask. The collected stylesheets go into the head
  through Unhead at `app:rendered`, and the scheme is kept in a cookie so the
  server renders the right one. The chart is not client-only: it renders its
  empty host on the server and fills it on mount, which hydrates cleanly, while
  Nuxt's client-only wrapper withholds the template until after `mounted` and
  leaves it nothing to draw in.
- `apps/nuxt-playground`, a real Nuxt app over the module (`pnpm dev:nuxt`),
  and `pnpm check:nuxt`, which runs it and checks the head of the first
  response, the cookie's scheme, and then, in a headless browser, that the page
  hydrates without a warning, the chart draws itself and the scheme switch
  writes the cookie. Without Chrome it skips the browser half.
- `@vitral/vue/resolver` for applications that are not on Nuxt:
  `VitralResolver()` for unplugin-vue-components and `vitralAutoImports()` for
  unplugin-auto-import, over the same manifest.

## Infrastructure

- CI: `pnpm test`, `pnpm typecheck`, `node scripts/gen-index.mjs --check`,
  `pnpm build`, `pnpm check:nuxt`, and screenshot comparison of the catalog in
  every preset.
- Release tooling (changesets) and the first publish.
- Scoped themes, a dark panel inside a light page. Needs every derived token
  re-declared on the scoped element; see the note in `compileTheme`.
- RTL.

## Open questions

- Name and scope. `@vitral/*` is free on npm today but not reserved.
- Licence. The packages say MIT; confirm before publishing.
- Templates as products. The site ships multi-screen templates
  (`apps/docs/src/templates/`), each a folder of screens over the shared
  tokens, which is the shape a paid template would take.
