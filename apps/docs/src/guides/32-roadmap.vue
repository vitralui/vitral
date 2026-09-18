<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Roadmap',
    section: 'Reference',
    description: 'Where the library stands at 0.1, and what is still open.'
};
</script>

<script setup lang="ts">
import { Tag } from '@vitral/vue';
import { entries } from '../lib/catalog';
</script>

<template>
    <h2>Done, in 0.1</h2>
    <ul>
        <li>A pnpm monorepo: TypeScript 5.9, Vite 8, Vitest 5 with jsdom and axe-core.</li>
        <li>
            <strong>@vitral/core</strong>: focus trap, dismissable layer stack, Floating UI positioning, z-index, scroll lock, list navigation and typeahead, the data layer,
            selection and tree helpers, calendar maths, locale-aware number formatting <em>and parsing</em>, the <code>en</code> and <code>pt-BR</code> locales, and the editing
            engine behind the Editor.
        </li>
        <li>
            <strong>@vitral/themes</strong>: the token engine, light and dark schemes by class, attribute or system, <code>definePreset</code>, <code>palette</code>,
            <code>updatePrimaryPalette</code>, a framework-free <code>createThemeManager</code>, and the presets Prism, Ink, Avalonia and Simple.
        </li>
        <li>
            <strong>@vitral/styles</strong>: shared chrome (<code>.vt-field</code>, <code>.vt-overlay</code>, <code>.vt-option</code>, <code>.vt-mask</code>) and every
            component's CSS and class map.
        </li>
        <li><strong>@vitral/vue</strong>: the plugin, reactive configuration, <code>useComponent</code>, the composables, the directives and {{ entries.length }} components.</li>
        <li>
            <strong>@vitral/chart</strong>: the chart with no framework in it. The engine, <code>createChart()</code> (legend, tooltip, toolbar, zoom, brush, groups, keyboard
            readout, export) and its CSS. The Vue <code>&lt;Chart&gt;</code> is a thin wrapper, and the React and Angular ones will be too.
        </li>
        <li>
            <strong>@vitral/forms</strong>: form state and validation with no dependencies. Nested paths, field arrays, built-in rules, async checks and resolvers for schema
            libraries, plus the <code>Form.Root</code>, <code>Form.Field</code>, <code>Form.Summary</code> parts in Vue.
        </li>
        <li>
            <strong>@vitral/nuxt</strong>: configuration from <code>nuxt.config</code>, auto-imported components and composables, stylesheets rendered on the server and the
            colour scheme in a cookie. See <a href="#/docs/server-rendering">server rendering</a>.
        </li>
        <li>
            This site: a landing page, the guides, a page per component and a page per theme, with <code>?preset=</code> and <code>?scheme=</code> for deterministic
            screenshots.
        </li>
    </ul>

    <h2>Still open</h2>
    <h3>Follow-ups on what shipped</h3>
    <ul>
        <li>Forms: binding FileUpload, which has no <code>v-model</code> yet, and testing the announcements with NVDA, JAWS and VoiceOver.</li>
        <li>Editor: text alignment, sub and superscript, table cell selection and merged cells, resizable images and image upload, and IME testing on real devices.</li>
        <li>Chart: a visual options editor on this site, range bars, logarithmic axes, and a theme editor for the component tokens.</li>
        <li>Schedule: time zones (dates are local today), editing a whole recurring series from a drag, and virtualised rows for large resource timelines.</li>
    </ul>

    <h3>Components</h3>
    <p>
        Virtual scrolling inside Select, Listbox and DataTable (VirtualScroller is there to build on), APG grid keyboard navigation for DataTable, closable tabs, and
        RepeatButton behaviour as an option on Button.
    </p>

    <h2>Framework adapters</h2>
    <p>
        The split that makes them cheap is already in place: behaviour in core, look in themes and styles, markup contract in the class maps.
        <Tag value="@vitral/react" severity="secondary" /> a <code>useComponent</code> hook mirroring the Vue one and a provider around <code>createThemeManager</code>;
        <Tag value="@vitral/angular" severity="secondary" /> signals-based components over the same packages. Worth deciding before either: whether Select, Tree and DatePicker
        should become framework-free state machines in core, so the adapters share the keyboard handling too.
    </p>
    <p>
        The chart is already shared whole. <code>@vitral/chart</code> draws it, so a React or Angular <code>&lt;Chart&gt;</code> is a thin wrapper: create it on mount,
        <code>update()</code> on input changes, <code>destroy()</code> on unmount, forward its events, and render templates into the nodes its hooks return.
    </p>

    <h2>Infrastructure</h2>
    <ul>
        <li>Continuous integration, release tooling (changesets) and the first publish.</li>
        <li>Scoped themes, a dark panel inside a light page. Every derived token has to be re-declared on the scoped element.</li>
        <li>Right-to-left support.</li>
        <li>A name for the chart component: the semantic <code>chart.*</code> palette collides with a component called <code>chart</code> in the token namespace.</li>
    </ul>
</template>
