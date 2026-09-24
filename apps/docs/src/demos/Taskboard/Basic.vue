<script setup lang="ts">
import { Button, Tag, Taskboard, type TaskboardCardMoveEvent, type TaskboardColumn } from '@vitral/vue';
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

let next = 7;
function add(column: string | number, team = 'Web') {
    tasks.value = [...tasks.value, { id: next, title: `New task ${next++}`, status: String(column), team, priority: 'low' }];
}

const log = ref<string[]>([]);
function onMove(event: TaskboardCardMoveEvent) {
    const task = event.item as Task;
    log.value = [`${task.title}: ${event.from.column} → ${event.to.column} (#${event.to.index + 1}, ${event.via})`, ...log.value].slice(0, 3);
}
</script>

<template>
    <Taskboard v-model:columns="columns" v-model:items="tasks" column-field="status" style="width: 100%" @card-move="onMove">
        <template #card="{ item, locked }">
            <div style="display: flex; flex-direction: column; gap: 0.5rem">
                <span>{{ (item as Task).title }}</span>
                <span style="display: flex; gap: 0.375rem; align-items: center">
                    <Tag :value="(item as Task).team" severity="secondary" />
                    <Tag v-if="(item as Task).priority === 'high'" value="High" severity="danger" />
                    <small v-if="locked" style="color: var(--vt-text-muted-color)">Locked</small>
                </span>
            </div>
        </template>
        <template #add-card="{ column }">
            <Button label="Add task" icon="plus" variant="text" size="small" severity="secondary" fluid @click="add(column.key)" />
        </template>
    </Taskboard>
    <small style="color: var(--vt-text-muted-color)">{{ log.length ? log.join(' · ') : 'Move a card to see the card-move event.' }}</small>
</template>
