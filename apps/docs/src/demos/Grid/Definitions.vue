<script setup lang="ts">
import { Grid, GridItem } from '@vitral/vue';
import { ref } from 'vue';

const lines = ref(true);
</script>

<template>
    <label class="toggle"><input v-model="lines" type="checkbox" /> showGridLines</label>
    <Grid class="frame" rows="Auto,*,2*,48" columns="160,*,Auto" :row-spacing="6" :column-spacing="6" :show-grid-lines="lines">
        <GridItem class="box c1" :column-span="3">row 0 · Auto — spans 3 columns</GridItem>
        <GridItem class="box c2" :row="1" :row-span="2">rows 1–2 · column 0 (160px)</GridItem>
        <GridItem class="box c3" :row="1" :column="1">row 1 (*) · column 1 (*)</GridItem>
        <GridItem class="box c4" :row="2" :column="1">row 2 (2*) · column 1</GridItem>
        <GridItem class="box c5" :row="1" :column="2" :row-span="2">column 2 · Auto</GridItem>
        <GridItem class="box c1" :row="3" :column-span="3">row 3 · 48px</GridItem>
    </Grid>
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
    height: 20rem;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
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
</style>
