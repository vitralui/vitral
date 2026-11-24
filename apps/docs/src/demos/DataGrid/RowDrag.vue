<script setup lang="ts">
import { Column, DataGrid, Tag } from '@vitral/vue';
import { ref } from 'vue';

interface Task {
    id: number;
    title: string;
    owner: string;
    estimate: number;
    status: 'To do' | 'Doing' | 'Review';
}

const backlog = ref<Task[]>([
    { id: 1, title: 'Sign-in with a passkey', owner: 'Ana', estimate: 5, status: 'Doing' },
    { id: 2, title: 'Export invoices to PDF', owner: 'Bruno', estimate: 3, status: 'To do' },
    { id: 3, title: 'Dark theme for charts', owner: 'Carla', estimate: 2, status: 'Review' },
    { id: 4, title: 'Bulk edit of prices', owner: 'Diego', estimate: 8, status: 'To do' },
    { id: 5, title: 'Search across projects', owner: 'Elisa', estimate: 5, status: 'To do' },
    { id: 6, title: 'Audit log retention', owner: 'Fábio', estimate: 3, status: 'Doing' }
]);

const severity = { 'To do': 'secondary', Doing: 'info', Review: 'warn' } as const;
</script>

<template>
    <DataGrid :value="backlog" data-key="id" aria-label="Backlog" class="demo-table" @row-reorder="backlog = $event.value as Task[]">
        <Column column-key="drag" row-drag :width="48" />
        <Column header="Priority" :width="90" align="right">
            <template #body="{ index }">{{ index + 1 }}</template>
        </Column>
        <Column field="title" header="Task" />
        <Column field="owner" header="Owner" />
        <Column field="estimate" header="Points" align="right" />
        <Column field="status" header="Status">
            <template #body="{ data }"><Tag :value="data.status" :severity="severity[data.status as Task['status']]" /></template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
