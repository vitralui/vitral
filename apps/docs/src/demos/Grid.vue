<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Grid',
    category: 'Layout',
    description:
        'A grid with star sizing: rows="Auto,*,2*,120" and columns="200,*" — Auto sizes to content, * shares what is left, 2* takes twice the share, a number is pixels, anything else is CSS. GridItem places a child with 0-based row, column and spans.'
};
</script>

<script setup lang="ts">
import { Grid, GridItem, InputText } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const lines = ref(true);
</script>

<template>
    <DemoSection title="Definitions" description="rows=&quot;Auto,*,2*,48&quot; columns=&quot;160,*,Auto&quot;, with showGridLines outlining each cell.">
        <label class="toggle"><input v-model="lines" type="checkbox" /> showGridLines</label>
        <Grid class="frame definitions" rows="Auto,*,2*,48" columns="160,*,Auto" :row-spacing="6" :column-spacing="6" :show-grid-lines="lines">
            <GridItem class="box c1" :column-span="3">row 0 · Auto — spans 3 columns</GridItem>
            <GridItem class="box c2" :row="1" :row-span="2">rows 1–2 · column 0 (160px)</GridItem>
            <GridItem class="box c3" :row="1" :column="1">row 1 (*) · column 1 (*)</GridItem>
            <GridItem class="box c4" :row="2" :column="1">row 2 (2*) · column 1</GridItem>
            <GridItem class="box c5" :row="1" :column="2" :row-span="2">column 2 · Auto</GridItem>
            <GridItem class="box c1" :row="3" :column-span="3">row 3 · 48px</GridItem>
        </Grid>
    </DemoSection>

    <DemoSection title="A form" description="columns=&quot;Auto,*&quot;: labels take what they need, fields take the rest. Row and column spacing are set separately.">
        <Grid class="form" rows="Auto,Auto,Auto" columns="Auto,*" :row-spacing="10" :column-spacing="16">
            <GridItem as="label" for="grid-name" class="label">Name</GridItem>
            <GridItem :column="1"><InputText id="grid-name" fluid placeholder="Ada Lovelace" /></GridItem>
            <GridItem as="label" for="grid-email" :row="1" class="label">Email address</GridItem>
            <GridItem :row="1" :column="1"><InputText id="grid-email" type="email" fluid placeholder="ada@example.com" /></GridItem>
            <GridItem as="label" for="grid-city" :row="2" class="label">City</GridItem>
            <GridItem :row="2" :column="1"><InputText id="grid-city" fluid placeholder="London" /></GridItem>
        </Grid>
    </DemoSection>
</template>

<style scoped>
.toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    font-size: 0.8125rem;
}

.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.definitions {
    height: 20rem;
}

.box {
    --c: var(--vt-chart-1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    text-align: center;
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

.form {
    width: 100%;
    max-width: 32rem;
    align-items: center;
}

.label {
    font-size: 0.8125rem;
    font-weight: 500;
}
</style>
