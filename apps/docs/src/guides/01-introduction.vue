<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Introduction',
    section: 'Get started',
    description: 'What Vitral is and what lives in which package.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href, base } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const usage = `<script setup lang="ts">
import { Button, InputText, Select } from '@vitral/vue';
import { ref } from 'vue';

const name = ref('');
const city = ref(null);
const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Recife', code: 'REC' }
];
<\/script>

<template>
    <label for="name">Name</label>
    <InputText id="name" v-model="name" clearable />

    <label for="city">City</label>
    <Select id="city" v-model="city" :options="cities" option-label="name" option-value="code" filter />

    <Button label="Save" icon="check" />
</template>`;
</script>

<template>
    <T k="intro">
        Vitral is a Vue 3 component library with design tokens in three layers, presets, pass-through to any part, an unstyled mode and composables for toasts and
        confirmations. The look is a parameter: the presets range from web-native to desktop, and your own sits on the same tokens.
    </T>
    <T k="scope">
        The set covers the controls an application is built from, the bigger pieces (charts, a scheduler, a task board, a rich text editor) and the layout panels every real
        screen needs: <code>StackPanel</code>, <code>DockPanel</code>, <code>Grid</code> with star sizing, <code>SplitView</code> and <code>Splitter</code>.
    </T>

    <blockquote>
        <T k="name"><em>Vitral</em> is Portuguese for stained glass.</T>
    </blockquote>

    <T k="look.title" as="h2">The look is a parameter</T>
    <T k="look.text">
        None of the above is baked in. A theme is a tree of tokens compiled to CSS variables, so the same components render as <a :href="href('/docs/presets')">Prism</a>,
        <a :href="href('/docs/presets')">Ink</a>, <a :href="href('/docs/presets')">Avalonia</a> or anything you define, with no fork, no rebuild and no second component library.
    </T>

    <T k="usage" as="h2">What it looks like to use</T>
    <CodeBlock :code="usage" label="Form.vue" lang="vue" />

    <T k="packages.title" as="h2">The packages</T>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <T k="packages.package" as="th">Package</T>
                    <T k="packages.holds" as="th">What it holds</T>
                    <T k="packages.framework" as="th">Framework</T>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>@vitral/core</td>
                    <T k="packages.core" as="td" class="doc">Focus trap, dismissable layer stack, positioning, z-index, list navigation and typeahead, the data layer (<code>FilterService</code>, <code>queryData</code>, <code>createDataSource</code>), trees, calendar maths, number formatting and parsing, locales</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/themes</td>
                    <T k="packages.themes" as="td" class="doc">The token engine (<code>definePreset</code>, <code>palette</code>, <code>compileTheme</code>, <code>createThemeManager</code>) and the presets Prism, Ink, Avalonia and Simple</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/styles</td>
                    <T k="packages.styles" as="td" class="doc">Every component's CSS and class map, written against tokens, also shipped as one <code>vitral.css</code></T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/icons</td>
                    <T k="packages.icons" as="td" class="doc">SVG icons as data</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/dom</td>
                    <T k="packages.dom" as="td" class="doc">What the framework-free packages render with: a keyed patcher, part classes with pass-through, a pointer drag, an auto-scroll and an icon</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/controls</td>
                    <T k="packages.controls" as="td" class="doc">The select, the menu and the anchored panel those packages need, over the same core arithmetic and wearing the same styles</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/chart</td>
                    <T k="packages.chart" as="td" class="doc">SVG charts: the engine and <code>createChart()</code>, a renderer with legend, tooltip, toolbar, zoom, brush and keyboard. The <code>&lt;Chart&gt;</code> component wraps it</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/datagrid</td>
                    <T k="packages.datagrid" as="td" class="doc">The data table: the engine (query, sort, filter, pages, selection, the column layout) and <code>createDataGrid()</code>, which draws a real <code>&lt;table&gt;</code></T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/schedule</td>
                    <T k="packages.schedule" as="td" class="doc">The calendar and scheduler: the engine (views, periods, recurrence, layout) and <code>createSchedule()</code>, with the keyboard and the pointer gestures</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/taskboard</td>
                    <T k="packages.taskboard" as="td" class="doc">The task board: the engine (columns, lanes, moves, work-in-progress limits) and <code>createTaskboard()</code>, with drag and drop a keyboard can do too</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/editor</td>
                    <T k="packages.editor" as="td" class="doc">The rich text editor's interface over the engine in core: <code>createTextEditor()</code>, the toolbar, the panels, the floating toolbar, the slash menu and the block handle</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/spreadsheet</td>
                    <T k="packages.spreadsheet" as="td" class="doc">
                        The spreadsheet: the engine (A1 references, formulas, the dependency graph that says what an edit reaches) and <code>createSpreadsheet()</code>, a
                        virtualised grid with the keyboard a spreadsheet has always had
                    </T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/forms</td>
                    <T k="packages.forms" as="td" class="doc">Form state and validation: nested paths, field arrays, built-in rules, async checks, and resolvers for schema libraries</T>
                    <T k="packages.none" as="td" class="doc">None</T>
                </tr>
                <tr>
                    <td>@vitral/vue</td>
                    <T k="packages.vue" as="td" class="doc">Components, composables, directives and the plugin</T>
                    <td class="doc">Vue 3</td>
                </tr>
                <tr>
                    <td>@vitral/nuxt</td>
                    <T k="packages.nuxt" as="td" class="doc">The Nuxt module: configuration from <code>nuxt.config</code>, auto-imports, styles rendered on the server, the scheme in a cookie</T>
                    <td class="doc">Nuxt 4</td>
                </tr>
            </tbody>
        </table>
    </div>
    <T k="packages.text">
        Everything that does not need a framework lives in a package that does not import one. That is what should make a React or Angular adapter cheap later: it writes the
        rendering and reuses the behaviour, the look and the markup contract. Seven of them go further: the chart, the table, the scheduler, the board, the editor and the
        spreadsheet draw themselves, and the form's rules draw nothing at all — so <code>&lt;Chart&gt;</code> and its like are wrappers, and a page with no framework calls the
        same function they do.
    </T>

    <T k="agents.title" as="h2">For coding agents</T>
    <!-- The llms files are not pages, so their links stay outside the translated text: a page's link is given the language's prefix, a file's must not be. -->
    <p>
        <T k="agents.intro" as="span">This documentation is also published as plain text, in the shape <a href="https://llmstxt.org" target="_blank" rel="noreferrer">llmstxt.org</a> describes, so an assistant can read it without a browser:</T> <a :href="`${base}/llms.txt`">llms.txt</a> <T k="agents.index" as="span">is the index,</T> <a :href="`${base}/llms-full.txt`">llms-full.txt</a> <T k="agents.full" as="span">is every page in one file, and any page becomes Markdown by adding <code>.md</code> to its URL. A component's text carries its props, events and slots, read from the source, and the full source of the examples on its page.</T>
    </p>

    <T k="next.title" as="h2">Where to go next</T>
    <ul>
        <T k="next.installation" as="li"><a :href="href('/docs/installation')">Installation</a>: the plugin, its options, auto-imports and the no-JavaScript route.</T>
        <T k="next.serverRendering" as="li"><a :href="href('/docs/server-rendering')">Server rendering</a>: SSR and the Nuxt module.</T>
        <T k="next.theming" as="li"><a :href="href('/docs/theming')">Theming</a>: how a token becomes a CSS variable, and how to change one.</T>
        <T k="next.presets" as="li"><a :href="href('/docs/presets')">Presets</a>: the themes that ship, and how to start your own.</T>
        <T k="next.templates" as="li"><a :href="href('/templates')">Templates</a>: whole applications built from the components, to preview and copy.</T>
        <T k="next.components" as="li"><a :href="href('/components')">Components</a>: the catalog, with live examples and API tables.</T>
    </ul>
</template>
