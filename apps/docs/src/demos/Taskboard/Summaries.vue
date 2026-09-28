<script setup lang="ts">
import { Taskboard, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';

const columns: TaskboardColumn[] = [
    { key: 'todo', title: 'To do' },
    { key: 'doing', title: 'In progress', wipLimit: 3 },
    { key: 'done', title: 'Done' }
];

interface Task {
    id: number;
    title: string;
    status: string;
    points: number;
}

const tasks = ref<Task[]>([
    { id: 1, title: 'Sign-in with passkeys', status: 'todo', points: 8 },
    { id: 2, title: 'Empty states', status: 'todo', points: 3 },
    { id: 3, title: 'Export to CSV', status: 'doing', points: 5 },
    { id: 4, title: 'Trend lines', status: 'doing', points: 5 },
    { id: 5, title: 'Guided tour', status: 'done', points: 13 }
]);
const task = (item: unknown) => item as Task;
</script>

<template>
    <Taskboard v-model:items="tasks" :columns="columns" column-field="status" :summary="{ field: 'points', format: '{value} pts' }" style="width: 100%" scroll-height="14rem">
        <template #card="{ item }">
            <span style="display: flex; justify-content: space-between; gap: 0.5rem; width: 100%">
                <span>{{ task(item).title }}</span>
                <small style="color: var(--vt-text-muted-color); white-space: nowrap">{{ task(item).points }} pts</small>
            </span>
        </template>
    </Taskboard>
</template>
