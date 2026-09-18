<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'StackPanel',
    category: 'Layout',
    description:
        'Arranges its children in one line, one below the other or side by side, with even spacing between them, over a flex box. Direction, spacing, alignment and wrapping are props applied inline, so it lays out the same unstyled.'
};
</script>

<script setup lang="ts">
import { Select, StackPanel } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const orientation = ref<'vertical' | 'horizontal'>('horizontal');
const align = ref('stretch');
const justify = ref('start');
// 'token' leaves `spacing` unset, so the panel falls back to the stackpanel.spacing token.
const spacingChoice = ref('token');
const spacing = computed(() => (spacingChoice.value === 'token' ? undefined : Number(spacingChoice.value)));

const orientations = [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' }
];
const aligns = ['stretch', 'start', 'center', 'end'].map((value) => ({ label: value, value }));
const justifies = ['start', 'center', 'end', 'space-between', 'space-evenly'].map((value) => ({ label: value, value }));
const spacings = [
    { label: 'Token (0.5rem)', value: 'token' },
    { label: '0', value: '0' },
    { label: '4px', value: '4' },
    { label: '16px', value: '16' },
    { label: '32px', value: '32' }
];

const tags = ['Vue', 'React', 'Angular', 'Svelte', 'Presets', 'Tokens', 'Pass-through', 'Unstyled', 'Flexbox', 'Accessibility', 'Layout', 'Panels'];
</script>

<template>
    <DemoSection title="Vertical" description="The default. Children stack top to bottom and stretch to the panel's width; the gap is the stackpanel.spacing token.">
        <StackPanel class="frame narrow">
            <div class="box c1">Header</div>
            <div class="box c2">Body</div>
            <div class="box c3">Footer</div>
        </StackPanel>
    </DemoSection>

    <DemoSection title="Orientation, spacing and alignment" description="The dashed frame is the panel. Align moves children across the line; justify spreads them along it.">
        <div class="controls">
            <div class="demo-field">
                <label for="sp-orientation">Orientation</label>
                <Select id="sp-orientation" v-model="orientation" :options="orientations" option-label="label" option-value="value" size="small" />
            </div>
            <div class="demo-field">
                <label for="sp-spacing">Spacing</label>
                <Select id="sp-spacing" v-model="spacingChoice":options="spacings" option-label="label" option-value="value" size="small" />
            </div>
            <div class="demo-field">
                <label for="sp-align">Align</label>
                <Select id="sp-align" v-model="align" :options="aligns" option-label="label" option-value="value" size="small" />
            </div>
            <div class="demo-field">
                <label for="sp-justify">Justify</label>
                <Select id="sp-justify" v-model="justify" :options="justifies" option-label="label" option-value="value" size="small" />
            </div>
        </div>
        <StackPanel class="frame tall" :orientation="orientation" :spacing="spacing" :align="align" :justify="justify">
            <div class="box c1 s1">One</div>
            <div class="box c2 s2">Two</div>
            <div class="box c3 s3">Three</div>
        </StackPanel>
    </DemoSection>

    <DemoSection title="Wrap" description="A horizontal stack with wrap flows onto more lines instead of overflowing.">
        <StackPanel class="frame" orientation="horizontal" wrap :spacing="6">
            <span v-for="(tag, i) in tags" :key="tag" class="box" :class="`c${(i % 5) + 1}`">{{ tag }}</span>
        </StackPanel>
    </DemoSection>
</template>

<style scoped>
.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
}

.controls .demo-field {
    min-width: 10rem;
}

.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.narrow {
    max-width: 18rem;
}

.tall {
    min-height: 11rem;
}

.box {
    --c: var(--vt-chart-1);
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
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

.s1 {
    min-width: 4rem;
    min-height: 2rem;
}
.s2 {
    min-width: 6rem;
    min-height: 3.5rem;
}
.s3 {
    min-width: 8rem;
    min-height: 5rem;
}
</style>
