<script setup lang="ts">
import { SelectButton, Tag, Taskboard, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';

type Place = 'start' | 'center' | 'end';

const columns = ref<TaskboardColumn[]>([
    { key: 'quote', title: 'Quote', color: '#64748b', items: [] },
    { key: 'cutting', title: 'Cutting', color: '#2563eb', subtitle: 'Quarantine\n12 pieces queued, 1.5 days', items: [{ id: 1, title: 'Order 0001 — 15 pieces' }] },
    { key: 'held', title: 'On hold', color: '#0891b2', collapsed: true, items: [] },
    { key: 'sewing', title: 'Sewing', color: '#7c3aed', subtitle: 'Outsourced', items: [] }
]);
const places: Place[] = ['start', 'center', 'end'];
const emptyAt = ref<Place>('start');
const titleAt = ref<Place>('start');
</script>

<template>
    <div class="demo-shape">
        <div class="demo-shape-bar">
            <span>Empty message</span>
            <SelectButton v-model="emptyAt" :options="places" size="small" :allow-empty="false" aria-label="Empty message" />
            <span>Collapsed title</span>
            <SelectButton v-model="titleAt" :options="places" size="small" :allow-empty="false" aria-label="Collapsed title" />
        </div>
        <Taskboard v-model:columns="columns" min-height="18rem" :empty-at="emptyAt" :collapsed-title-at="titleAt">
            <Taskboard.ColumnHeader v-slot="{ column, collapsed }">
                <span v-if="!collapsed" class="demo-shape-heading">
                    <span class="demo-shape-dot" :style="{ background: column.color }" />
                    <Tag :value="column.title" severity="secondary" />
                </span>
            </Taskboard.ColumnHeader>
        </Taskboard>
    </div>
</template>

<style scoped>
.demo-shape {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.demo-shape-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    font-size: 0.875rem;
}

.demo-shape-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
}

.demo-shape-dot {
    flex: none;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
}
</style>
