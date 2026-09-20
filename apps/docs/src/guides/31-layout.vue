<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Layout panels',
    section: 'Reference',
    description: 'The seven components an application is assembled from, and what each one is for.'
};
</script>

<script setup lang="ts">
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

const rows: [string, string, string][] = [
    ['StackPanel', 'One line of children', 'Orientation, spacing, alignment and wrapping. A flex box with the props named after what they do.'],
    ['WrapPanel', 'Children that flow onto new lines', '`itemWidth` and `itemHeight` give every child the same size; lines pack at the start instead of stretching.'],
    ['UniformGrid', 'Equal cells', 'Rows and columns derived from the children when only one is given, with `firstColumn` for a gap before the first.'],
    ['DockPanel', 'Regions welded to the edges', 'A slot per edge (`#top`, `#bottom`, `#left`, `#right`), and the default slot fills what is left. `dockOrder` decides who wins the corners.'],
    ['Grid', 'Rows and columns, by definition', 'Star sizing: `columns="Auto,*,2*,120"`. `GridItem` places a child by 0-based row and column, with spans.'],
    ['SplitView', 'A pane beside the content', '`inline`, `overlay`, `compactInline` and `compactOverlay`; the floating modes light-dismiss and return focus.'],
    ['Splitter', 'Panels the reader resizes', 'Drag a gutter, or focus it and use the arrow keys; Home and End take it to its limits.']
];

const shell = `<DockPanel>
    <template #top><Toolbar /></template>
    <template #bottom><StatusBar /></template>

    <SplitView v-model:open="pane" display-mode="compactInline" :open-pane-length="240">
        <template #pane><Listbox :options="sections" /></template>

        <Grid columns="2*,Auto,*" :column-spacing="12">
            <GridItem :column="0"><DataGrid :value="rows" /></GridItem>
            <GridItem :column="2"><Panel header="Details" toggleable /></GridItem>
        </Grid>
    </SplitView>
</DockPanel>`;
</script>

<template>
    <p>
        Component libraries rarely have these, and every application ends up writing them: the panels that decide where things go. They are thin, flexbox and CSS grid
        underneath, with the arithmetic in <code>@vitral/core</code> so an adapter for another framework gets it for free, and they survive
        <a :href="href('/docs/unstyled')">unstyled mode</a>, because their layout is inline styles rather than classes.
    </p>

    <h2>The seven</h2>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <th>Component</th>
                    <th>For</th>
                    <th>What it gives you</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in rows" :key="row[0]">
                    <td><a :href="href(`/components/${row[0].toLowerCase()}`)">{{ row[0] }}</a></td>
                    <td class="doc">{{ row[1] }}</td>
                    <td class="doc">{{ row[2] }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <h2>An application shell, in one template</h2>
    <CodeBlock :code="shell" label="AppShell.vue" lang="vue" />
    <p>
        That is the shape most desktop tools share: a toolbar docked to the top, a status strip to the bottom, a pane that collapses to a strip of icons, and a grid
        splitting the rest.
    </p>

    <h2>Star sizing</h2>
    <ul>
        <li><code>Auto</code>: the track takes what its content needs.</li>
        <li><code>*</code>: one share of what is left. <code>2*</code> takes twice the share of a <code>*</code>.</li>
        <li>A number: pixels.</li>
        <li>Anything else (<code>20%</code>, <code>10rem</code>, <code>minmax(8rem, 1fr)</code>) passes through as CSS.</li>
    </ul>
    <p>Row and column spacing are separate props, and a <code>showGridLines</code> flag outlines every cell while you are getting a layout right.</p>
</template>
