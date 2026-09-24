<script setup lang="ts">
import { Taskboard, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';

interface Task {
    id: number;
    title: string;
    status: string;
    team: string;
    priority: 'low' | 'high';
    locked?: boolean;
}

const columns = ref<TaskboardColumn[]>([
    { key: 'backlog', title: 'Backlog', color: 'var(--vt-chart-8)' },
    { key: 'todo', title: 'To do', color: 'var(--vt-chart-4)' },
    { key: 'doing', title: 'In progress', wipLimit: 2, color: 'var(--vt-chart-5)' },
    { key: 'done', title: 'Done', color: 'var(--vt-chart-3)' }
]);

const tasks = ref<Task[]>([
    { id: 1, title: 'Draft the release notes', status: 'backlog', team: 'Docs', priority: 'low' },
    { id: 2, title: 'Audit colour contrast', status: 'todo', team: 'Design', priority: 'high' },
    { id: 3, title: 'Virtual scrolling in Select', status: 'todo', team: 'Web', priority: 'low' },
    { id: 4, title: 'Keyboard grid for DataGrid', status: 'doing', team: 'Web', priority: 'high' },
    { id: 5, title: 'Theme editor prototype', status: 'doing', team: 'Design', priority: 'low' },
    { id: 6, title: 'Publish 0.1', status: 'done', team: 'Web', priority: 'high', locked: true }
]);
</script>

<template>
    <Taskboard v-model:columns="columns" v-model:items="tasks" column-field="status" lane-field="team" :reorder-columns="false" style="width: 100%" scroll-height="14rem">
        <template #lane-header="{ lane, count }">
            <strong>{{ lane.title }}</strong>
            <small style="color: var(--vt-text-muted-color)">{{ count }} tasks</small>
        </template>
    </Taskboard>
</template>
