<script setup lang="ts">
import { Button, SplitView } from '@vitral/vue';
import { ref } from 'vue';

const details = ref(true);
</script>

<template>
    <SplitView v-model:open="details" class="app-frame" display-mode="inline" placement="right" :open-pane-length="220" pane-label="Details">
        <template #pane="{ close }">
            <div class="details">
                <header class="page-bar">
                    <h4>Details</h4>
                    <Button icon="close" variant="text" severity="secondary" size="small" aria-label="Close details" @click="close" />
                </header>
                <dl>
                    <dt>Name</dt>
                    <dd>report-2026.pdf</dd>
                    <dt>Size</dt>
                    <dd>1.2 MB</dd>
                    <dt>Modified</dt>
                    <dd>Yesterday</dd>
                </dl>
            </div>
        </template>
        <template #default="{ paneId, toggle, open: isOpen }">
            <div class="page">
                <header class="page-bar">
                    <h4>Files</h4>
                    <Button :label="isOpen ? 'Hide details' : 'Show details'" icon="sidebar" severity="secondary" size="small" :aria-controls="paneId" :aria-expanded="isOpen ? 'true' : 'false'" @click="toggle" />
                </header>
                <div class="cards">
                    <div v-for="n in 4" :key="n" class="card" :class="`c${n}`">file {{ n }}</div>
                </div>
            </div>
        </template>
    </SplitView>
</template>

<style scoped>
.app-frame {
    width: 100%;
    height: 15rem;
    background: var(--vt-content-background);
    border: 1px solid var(--vt-content-border-color);
    border-radius: var(--vt-border-radius-lg);
}

.page {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem 1rem;
}

.page-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 2rem;
}

.page-bar h4 {
    margin: 0;
    margin-inline-end: auto;
    font-size: 1.125rem;
    font-weight: 600;
}

.cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
    gap: 0.5rem;
}

.card {
    --c: var(--vt-chart-1);
    min-height: 4.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
    border-radius: var(--vt-border-radius-md);
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

.details {
    padding: 0.75rem 1rem;
}

.details dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.375rem 0.75rem;
    margin: 0.75rem 0 0;
    font-size: 0.8125rem;
}

.details dt {
    color: var(--vt-text-muted-color);
}

.details dd {
    margin: 0;
}
</style>
