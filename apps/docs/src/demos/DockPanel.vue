<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DockPanel',
    category: 'Layout',
    description:
        'Docks regions to its edges and gives what is left to the fill, as a CSS grid with named areas. The top, bottom, left and right slots dock; the default slot fills. `dockOrder` decides which edges dock first, and those win the corners.'
};
</script>

<script setup lang="ts">
import { DockPanel, Select } from '@vitral/vue';
import { reactive, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const orders = [
    { label: 'Top & bottom first (default)', value: 'top,bottom,left,right' },
    { label: 'Left & right first', value: 'left,right,top,bottom' },
    { label: 'Top, left, bottom, right', value: 'top,left,bottom,right' },
    { label: 'Left, top, right, bottom', value: 'left,top,right,bottom' }
];
const order = ref(orders[0]!.value);
const edges = reactive({ top: true, bottom: true, left: true, right: true });
const spacing = ref(false);
</script>

<template>
    <DemoSection title="An application frame" description="A toolbar, a status bar, a file tree and a properties pane around an editor.">
        <div class="controls">
            <div class="demo-field">
                <label for="dp-order">Dock order</label>
                <Select id="dp-order" v-model="order" :options="orders" option-label="label" option-value="value" size="small" />
            </div>
            <fieldset class="edges">
                <legend>Edges</legend>
                <label v-for="(on, edge) in edges" :key="edge"><input v-model="edges[edge]" type="checkbox" /> {{ edge }}</label>
                <label><input v-model="spacing" type="checkbox" /> spacing</label>
            </fieldset>
        </div>
        <DockPanel class="frame app" :dock-order="order" :spacing="spacing ? 6 : undefined">
            <template v-if="edges.top" #top><div class="box c1">top — toolbar</div></template>
            <template v-if="edges.bottom" #bottom><div class="box c4">bottom — status bar</div></template>
            <template v-if="edges.left" #left><div class="box c2 side">left — files</div></template>
            <template v-if="edges.right" #right><div class="box c5 side">right — properties</div></template>
            <div class="box c3 fill">fill — the editor</div>
        </DockPanel>
    </DemoSection>

    <DemoSection title="Only what is there" description="Just a left slot and the fill: no tracks, and no gaps, for the edges that are absent.">
        <DockPanel class="frame small" :spacing="8">
            <template #left><div class="box c2 side">left</div></template>
            <div class="box c3 fill">fill</div>
        </DockPanel>
    </DemoSection>
</template>

<style scoped>
.controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1rem;
    width: 100%;
}

.edges {
    display: flex;
    gap: 0.75rem;
    margin: 0;
    padding: 0.25rem 0.75rem 0.5rem;
    font-size: 0.8125rem;
    border: 1px solid var(--vt-content-border-color);
    border-radius: var(--vt-border-radius-md);
}

.edges legend {
    padding: 0 0.25rem;
    font-weight: 500;
}

.edges label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
}

.frame {
    width: 100%;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
    overflow: hidden;
}

.app {
    height: 20rem;
}

.small {
    height: 8rem;
    padding: 0.5rem;
}

.box {
    --c: var(--vt-chart-1);
    box-sizing: border-box;
    height: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
}

.side {
    width: 10rem;
}

.fill {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.c1 {
    --c: var(--vt-chart-1);
}
.c2 {
    --c: var(--vt-chart-2);
}
.c3 {
    --c: var(--vt-chart-3);
}
.c4 {
    --c: var(--vt-chart-4);
}
.c5 {
    --c: var(--vt-chart-5);
}
</style>
