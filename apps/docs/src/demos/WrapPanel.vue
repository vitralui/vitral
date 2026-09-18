<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'WrapPanel',
    category: 'Layout',
    description:
        'Lays children out left to right and starts a new line when one is full — or top to bottom, starting a new column. `itemWidth` and `itemHeight` give every child the same size.'
};
</script>

<script setup lang="ts">
import { WrapPanel } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const words = ['Button', 'CheckBox', 'ComboBox', 'DatePicker', 'Expander', 'Grid', 'ListBox', 'Menu', 'NumericUpDown', 'ProgressBar', 'RadioButton', 'Slider', 'SplitView', 'TabControl', 'TextBox', 'ToggleSwitch', 'TreeView'];
const tiles = ['Photos', 'Mail', 'Maps', 'Music', 'Video', 'News', 'Store', 'Weather', 'Clock', 'Notes'];
</script>

<template>
    <DemoSection title="Horizontal" description="Each child keeps its own width. Drag the frame's corner to resize it and watch the lines re-flow.">
        <WrapPanel class="frame resizable">
            <span v-for="(word, i) in words" :key="word" class="box" :class="`c${(i % 5) + 1}`">{{ word }}</span>
        </WrapPanel>
    </DemoSection>

    <DemoSection title="ItemWidth and ItemHeight" description="item-width=&quot;120&quot; item-height=&quot;72&quot;: every child the same size, whatever its content.">
        <WrapPanel class="frame resizable" :item-width="120" :item-height="72" :spacing="8">
            <div v-for="(tile, i) in tiles" :key="tile" class="box tile" :class="`c${(i % 5) + 1}`">{{ tile }}</div>
        </WrapPanel>
    </DemoSection>

    <DemoSection title="Vertical" description="Fills columns top to bottom; needs a height to wrap in.">
        <WrapPanel class="frame short" orientation="vertical" :item-width="140">
            <span v-for="(word, i) in words" :key="word" class="box" :class="`c${(i % 5) + 1}`">{{ word }}</span>
        </WrapPanel>
    </DemoSection>
</template>

<style scoped>
.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.resizable {
    resize: horizontal;
    overflow: auto;
    min-width: 12rem;
}

.short {
    height: 10rem;
    overflow: auto;
}

.box {
    --c: var(--vt-chart-1);
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
}

.tile {
    display: flex;
    align-items: flex-end;
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
