<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Introduction',
    section: 'Get started',
    description: 'What Vitral is, what it takes from where, and what lives in which package.'
};
</script>

<script setup lang="ts">
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
    <p>
        Vitral is a component library for the web with design tokens in three layers,
        presets, pass-through to any part, unstyled mode, composables for toasts and confirmations — and a look that is a parameter: presets from web-native to
        desktop, and your own on the same tokens.
    </p>
    <p>
        The set covers the controls an application is built from, the application pieces — charts, a scheduler, a task board, a rich text editor — and the layout
        panels every real screen needs: <code>StackPanel</code>, <code>DockPanel</code>, <code>Grid</code> with star sizing, <code>SplitView</code>,
        <code>Splitter</code>. The <a href="#/docs/roadmap">roadmap</a> says what comes next.
    </p>

    <blockquote>
        <p><em>Vitral</em> is Portuguese for stained glass: many pieces of coloured glass held in one frame, with the light — the theme — coming through all of them at once.</p>
    </blockquote>

    <h2>The look is a parameter</h2>
    <p>
        What makes the library worth writing is that none of the above is baked in. A theme is a tree of tokens compiled to CSS variables, so the same components render as
        <a href="#/docs/presets">Prism</a>, as <a href="#/docs/presets">Ink</a>, as <a href="#/docs/presets">Avalonia</a> or as anything you define — without a fork, a rebuild
        or a second component library.
    </p>

    <h2>What it looks like to use</h2>
    <CodeBlock :code="usage" label="Form.vue" lang="vue" />

    <h2>The packages</h2>
    <table class="api-table">
        <thead>
            <tr>
                <th>Package</th>
                <th>What it holds</th>
                <th>Framework</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>@vitral/core</td>
                <td class="doc">Focus trap, dismissable layer stack, positioning, z-index, list navigation and typeahead, the data layer (<code>FilterService</code>, <code>queryData</code>, <code>createDataSource</code>), trees, calendar maths, number formatting and parsing, locales</td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/themes</td>
                <td class="doc">The token engine (<code>definePreset</code>, <code>palette</code>, <code>compileTheme</code>, <code>createThemeManager</code>) and the presets Prism, Ink, Avalonia and Simple</td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/styles</td>
                <td class="doc">Every component's CSS and class map, written against tokens — also shipped as one <code>vitral.css</code></td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/icons</td>
                <td class="doc">SVG icons as data</td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/chart</td>
                <td class="doc">SVG charts: the engine and <code>createChart()</code>, a renderer with the legend, tooltip, toolbar, zoom, brush and keyboard — the <code>&lt;Chart&gt;</code> component wraps it</td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/forms</td>
                <td class="doc">Form state and validation: nested paths, field arrays, built-in rules, async checks, and resolvers for schema libraries</td>
                <td class="doc">None</td>
            </tr>
            <tr>
                <td>@vitral/vue</td>
                <td class="doc">Components, composables, directives and the plugin</td>
                <td class="doc">Vue 3</td>
            </tr>
        </tbody>
    </table>
    <p>
        Everything that does not need a framework lives in a package that does not import one. That is what makes a React or Angular adapter cheap later: it writes rendering, and
        reuses the behaviour, the look and the markup contract.
    </p>

    <h2>Where to go next</h2>
    <ul>
        <li><a href="#/docs/installation">Installation</a> — the plugin, the options, and the no-JavaScript route.</li>
        <li><a href="#/docs/theming">Theming</a> — how a token becomes a CSS variable, and how to change one.</li>
        <li><a href="#/docs/presets">Presets</a> — the four themes that ship, and how to start your own.</li>
        <li><a href="#/templates">Templates</a> — whole applications built from the components, to preview and copy.</li>
        <li><a href="#/components/button">Components</a> — the catalog, with live examples and API tables.</li>
    </ul>
</template>
