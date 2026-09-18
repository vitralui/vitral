<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Splitter',
    category: 'Layout',
    description:
        'Panels with a gutter between each pair that resizes them. Drag a gutter, or focus it and use the arrow keys (Home and End go to its limits); neither panel goes below its min-size. Each gutter is a WAI-ARIA window splitter.'
};
</script>

<script setup lang="ts">
import { Splitter, SplitterPanel, type SplitterResizeEvent } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const sizes = ref([25, 50, 25]);
const ended = ref<number[] | null>(null);
const show = (value: number | undefined) => `${Math.round(value ?? 0)}%`;
const onResize = (event: SplitterResizeEvent) => (sizes.value = event.sizes);
</script>

<template>
    <DemoSection title="Horizontal" description="Three panels, each with min-size 10. The panels show their own size, from the resize event.">
        <Splitter class="demo-splitter" @resize="onResize" @resizeend="ended = $event.sizes">
            <SplitterPanel :size="25" :min-size="10"><div class="cell c1">{{ show(sizes[0]) }}</div></SplitterPanel>
            <SplitterPanel :size="50" :min-size="10"><div class="cell c2">{{ show(sizes[1]) }}</div></SplitterPanel>
            <SplitterPanel :size="25" :min-size="10"><div class="cell c3">{{ show(sizes[2]) }}</div></SplitterPanel>
        </Splitter>
        <span class="demo-hint">resizeend: {{ ended ? ended.map((s) => show(s)).join(' · ') : '—' }}</span>
    </DemoSection>

    <DemoSection title="Vertical" description="layout=&quot;vertical&quot; stacks the panels; the arrow keys are Up and Down.">
        <Splitter class="demo-splitter tall" layout="vertical" :gutter-size="6">
            <SplitterPanel :size="40"><div class="cell c4">top</div></SplitterPanel>
            <SplitterPanel :min-size="20"><div class="cell c5">bottom (min-size 20)</div></SplitterPanel>
        </Splitter>
    </DemoSection>

    <DemoSection title="Nested" description="A splitter inside a panel fills it: an explorer beside an editor over a terminal.">
        <Splitter class="demo-splitter tall">
            <SplitterPanel :size="28" :min-size="15"><div class="cell c2">explorer</div></SplitterPanel>
            <SplitterPanel>
                <Splitter layout="vertical">
                    <SplitterPanel :size="65"><div class="cell c1">editor</div></SplitterPanel>
                    <SplitterPanel><div class="cell c3">terminal</div></SplitterPanel>
                </Splitter>
            </SplitterPanel>
        </Splitter>
    </DemoSection>
</template>

<style scoped>
.demo-splitter {
    width: 100%;
    height: 12rem;
}

.tall {
    height: 18rem;
}

.cell {
    --c: var(--vt-chart-1);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 14%, transparent);
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
