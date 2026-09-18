<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Roadmap',
    section: 'Reference',
    description: 'Where the library stands at 0.1, and what the next rounds hold.'
};
</script>

<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { entries } from '../lib/catalog';
</script>

<template>
    <h2>Landed — 0.1</h2>
    <ul>
        <li>A pnpm monorepo: TypeScript 5.9, Vite 8, Vitest 5 with jsdom and axe-core.</li>
        <li><strong>@vitral/core</strong> — focus trap, dismissable layer stack, Floating UI positioning, z-index, scroll lock, list navigation and typeahead, the data layer, selection and tree helpers, calendar maths, locale-aware number formatting <em>and parsing</em>, the <code>en</code> and <code>pt-BR</code> locales.</li>
        <li><strong>@vitral/themes</strong> — the token engine, light/dark schemes by class, attribute or system, <code>definePreset</code>, <code>palette</code>, <code>updatePrimaryPalette</code>, a framework-free <code>createThemeManager</code>, and the presets Prism, Ink, Avalonia and Simple.</li>
        <li><strong>@vitral/styles</strong> — shared chrome (<code>.vt-field</code>, <code>.vt-overlay</code>, <code>.vt-option</code>, <code>.vt-mask</code>) and every component's CSS and class map.</li>
        <li><strong>@vitral/vue</strong> — the plugin, reactive configuration, <code>useComponent</code>, the composables, the directives and {{ entries.length }} components.</li>
        <li><strong>@vitral/chart</strong> — the chart with no framework in it: the engine, <code>createChart()</code> (legend, tooltip, toolbar, zoom, brush, groups, keyboard readout, export) and its CSS. The Vue <code>&lt;Chart&gt;</code> is a thin wrapper, and so will the React and Angular ones be.</li>
        <li><strong>@vitral/forms</strong> — form state and validation with no dependencies: nested paths, field arrays, built-in rules, async checks and resolvers for schema libraries; in Vue, the <code>Form.Root</code>, <code>Form.Field</code>, <code>Form.Summary</code>… parts.</li>
        <li>This site: a landing page, the guides, a page per component and a page per theme — with <code>?preset=</code> and <code>?scheme=</code> for deterministic screenshots.</li>
    </ul>

    <h2>Next components</h2>
    <p>Most used first.</p>
    <h3>Form</h3>
    <p>AutoComplete, MultiSelect, Password, InputMask, InputOtp, SelectButton, ToggleButton, Rating, Knob, ColorPicker (ColorView), TreeSelect, CascadeSelect, FloatLabel / IftaLabel, InputGroup.</p>
    <h3>Button</h3>
    <p>SplitButton, DropDownButton, SpeedDial, ButtonGroup, and RepeatButton behaviour as an option on Button.</p>
    <h3>Data</h3>
    <p>TreeTable (TreeDataGrid), DataView, VirtualScroller (ItemsRepeater / VirtualizingStackPanel) — then virtual scrolling inside Select, Listbox and DataTable — OrderList, PickList, Timeline, OrganizationChart, and APG grid keyboard navigation for DataTable.</p>
    <h3>Panel and menu</h3>
    <p>Fieldset, ScrollPanel, Stepper, TieredMenu, Menubar, ContextMenu, PanelMenu, MegaMenu, Dock, and closable tabs (TabStrip).</p>
    <h3>Misc and media</h3>
    <p>Avatar, Skeleton, Chip, MeterGroup, Image, Galleria, Carousel, FileUpload, ScrollTop, Inplace, TimePicker, BlockUI.</p>

    <h2>Framework adapters</h2>
    <p>
        The split that makes them cheap is already in place: behaviour in core, look in themes and styles, markup contract in the class maps.
        <Tag value="@vitral/react" severity="secondary" /> a <code>useComponent</code> hook mirroring the Vue one and a provider around <code>createThemeManager</code>;
        <Tag value="@vitral/angular" severity="secondary" /> signals-based components over the same packages. Worth deciding before either: whether Select, Tree and DatePicker
        should become framework-free state machines in core, so the adapters share the keyboard handling too.
    </p>
    <p>
        The chart is already shared whole: <code>@vitral/chart</code> draws it, so a React or Angular <code>&lt;Chart&gt;</code> is a thin wrapper — create it on mount, <code>update()</code> on input
        changes, <code>destroy()</code> on unmount, forward its events, and render templates into the nodes its hooks return.
    </p>

    <h2>Infrastructure</h2>
    <ul>
        <li>
            Nuxt is done — see <a href="#/docs/server-rendering">server rendering</a>: a render collects the stylesheets it used and the page arrives dressed, with no
            unstyled flash and no flash of the wrong scheme, and <code>@vitral/nuxt</code> adds the auto-imports and the scheme cookie on top.
        </li>
        <li>A resolver for unplugin-vue-components, for plain Vite apps.</li>
        <li>A name for the chart component — the semantic <code>chart.*</code> palette would collide with a component called <code>chart</code> in the token namespace.</li>
    </ul>
</template>
