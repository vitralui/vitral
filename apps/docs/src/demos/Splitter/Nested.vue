<script setup lang="ts">
import { Splitter, SplitterPanel } from '@vitral/vue';
</script>

<template>
    <Splitter class="demo-splitter">
        <SplitterPanel :size="28" :min-size="15"><div class="cell c2">explorer</div></SplitterPanel>
        <SplitterPanel>
            <Splitter layout="vertical">
                <SplitterPanel :size="65"><div class="cell c1">editor</div></SplitterPanel>
                <SplitterPanel><div class="cell c3">terminal</div></SplitterPanel>
            </Splitter>
        </SplitterPanel>
    </Splitter>
</template>

<style scoped>
.demo-splitter {
    width: 100%;
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
</style>
