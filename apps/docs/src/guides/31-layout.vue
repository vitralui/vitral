<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'Layout panels',
    section: 'Reference',
    description: 'The seven components an application is assembled from, and what each one is for.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';

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
    <T k="intro">
        Component libraries rarely have these, and every application ends up writing them: the panels that decide where things go. They are thin, flexbox and CSS grid
        underneath, with the arithmetic in <code>@vitral/core</code> so an adapter for another framework gets it for free, and they survive
        <a :href="href('/docs/unstyled')">unstyled mode</a>, because their layout is inline styles rather than classes.
    </T>

    <T k="seven.title" as="h2">The seven</T>
    <div class="api-scroll">
        <table class="api-table">
            <thead>
                <tr>
                    <T k="seven.component" as="th">Component</T>
                    <T k="seven.for" as="th">For</T>
                    <T k="seven.gives" as="th">What it gives you</T>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><a :href="href('/components/stackpanel')">StackPanel</a></td>
                    <T k="stackpanel.for" as="td" class="doc">One line of children</T>
                    <T k="stackpanel.gives" as="td" class="doc">Orientation, spacing, alignment and wrapping. A flex box with the props named after what they do.</T>
                </tr>
                <tr>
                    <td><a :href="href('/components/wrappanel')">WrapPanel</a></td>
                    <T k="wrappanel.for" as="td" class="doc">Children that flow onto new lines</T>
                    <T k="wrappanel.gives" as="td" class="doc"><code>itemWidth</code> and <code>itemHeight</code> give every child the same size; lines pack at the start instead of stretching.</T>
                </tr>
                <tr>
                    <td><a :href="href('/components/uniformgrid')">UniformGrid</a></td>
                    <T k="uniformgrid.for" as="td" class="doc">Equal cells</T>
                    <T k="uniformgrid.gives" as="td" class="doc">Rows and columns derived from the children when only one is given, with <code>firstColumn</code> for a gap before the first.</T>
                </tr>
                <tr>
                    <td><a :href="href('/components/dockpanel')">DockPanel</a></td>
                    <T k="dockpanel.for" as="td" class="doc">Regions welded to the edges</T>
                    <T k="dockpanel.gives" as="td" class="doc">
                        A slot per edge (<code>#top</code>, <code>#bottom</code>, <code>#left</code>, <code>#right</code>), and the default slot fills what is left. <code>dockOrder</code>
                        decides who wins the corners.
                    </T>
                </tr>
                <tr>
                    <td><a :href="href('/components/grid')">Grid</a></td>
                    <T k="grid.for" as="td" class="doc">Rows and columns, by definition</T>
                    <T k="grid.gives" as="td" class="doc">Star sizing: <code>columns="Auto,*,2*,120"</code>. <code>GridItem</code> places a child by 0-based row and column, with spans.</T>
                </tr>
                <tr>
                    <td><a :href="href('/components/splitview')">SplitView</a></td>
                    <T k="splitview.for" as="td" class="doc">A pane beside the content</T>
                    <T k="splitview.gives" as="td" class="doc">
                        <code>inline</code>, <code>overlay</code>, <code>compactInline</code> and <code>compactOverlay</code>; the floating modes light-dismiss and return focus.
                    </T>
                </tr>
                <tr>
                    <td><a :href="href('/components/splitter')">Splitter</a></td>
                    <T k="splitter.for" as="td" class="doc">Panels the reader resizes</T>
                    <T k="splitter.gives" as="td" class="doc">Drag a gutter, or focus it and use the arrow keys; Home and End take it to its limits.</T>
                </tr>
            </tbody>
        </table>
    </div>

    <T k="shell.title" as="h2">An application shell, in one template</T>
    <CodeBlock :code="shell" label="AppShell.vue" lang="vue" />
    <T k="shell.text">
        That is the shape most desktop tools share: a toolbar docked to the top, a status strip to the bottom, a pane that collapses to a strip of icons, and a grid
        splitting the rest.
    </T>

    <T k="star.title" as="h2">Star sizing</T>
    <ul>
        <T k="star.auto" as="li"><code>Auto</code>: the track takes what its content needs.</T>
        <T k="star.share" as="li"><code>*</code>: one share of what is left. <code>2*</code> takes twice the share of a <code>*</code>.</T>
        <T k="star.number" as="li">A number: pixels.</T>
        <T k="star.other" as="li">Anything else (<code>20%</code>, <code>10rem</code>, <code>minmax(8rem, 1fr)</code>) passes through as CSS.</T>
    </ul>
    <T k="star.spacing">Row and column spacing are separate props, and a <code>showGridLines</code> flag outlines every cell while you are getting a layout right.</T>
</template>
