<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Taskboard',
    category: 'Data',
    description:
        'A kanban board: cards in columns, optionally split into swimlanes. Drag cards and columns with a mouse, a pen or a finger (rest it a moment), or from the keyboard: Space picks a card up, the arrows carry it, Space drops it and Escape puts it back, with every step announced. Columns can hold a work-in-progress limit, collapse, or be locked.'
};
</script>

<script setup lang="ts">
import { Button, Tag, Taskboard, type TaskboardCardMoveEvent, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    { id: 4, title: 'Keyboard grid for DataTable', status: 'doing', team: 'Web', priority: 'high' },
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

const nested = ref<TaskboardColumn[]>([
    { key: 'ideas', title: 'Ideas', items: [{ id: 'a', title: 'Dark mode for charts' }, { id: 'b', title: 'Right-to-left layout' }] },
    { key: 'next', title: 'Next', items: [{ id: 'c', title: 'Nuxt module' }] },
    { key: 'later', title: 'Later', collapsed: true, items: [{ id: 'd', title: 'Angular adapter' }, { id: 'e', title: 'React adapter' }] },
    { key: 'frozen', title: 'Frozen', locked: true, items: [{ id: 'f', title: 'IE support', disabled: true }] }
]);

// Only high-priority work may skip straight to Done.
const canDrop = ({ item, from, to }: { item: unknown; from: { column: string | number }; to: { column: string | number } }) =>
    !(to.column === 'done' && from.column !== 'doing' && (item as Task).priority !== 'high');
</script>

<template>
    <DemoSection title="Basic" description="A flat list of tasks, each naming its column. In progress holds two at most.">
        <Taskboard v-model:columns="columns" v-model:items="tasks" column-field="status" style="width: 100%" @card-move="onMove">
            <template #card="{ item, locked }">
                <div style="display: flex; flex-direction: column; gap: 0.5rem">
                    <span>{{ (item as Task).title }}</span>
                    <span style="display: flex; gap: 0.375rem; align-items: center">
                        <Tag :value="(item as Task).team" severity="secondary" />
                        <Tag v-if="(item as Task).priority === 'high'" value="High" severity="danger" />
                        <small v-if="locked" class="demo-hint">Locked</small>
                    </span>
                </div>
            </template>
            <template #add-card="{ column }">
                <Button label="Add task" icon="plus" variant="text" size="small" severity="secondary" fluid @click="add(column.key)" />
            </template>
        </Taskboard>
        <span class="demo-hint">{{ log.length ? log.join(' · ') : 'Move a card to see the card-move event.' }}</span>
    </DemoSection>

    <DemoSection title="Swimlanes" description="The same tasks split by team. Page Up and Page Down carry a picked-up card between lanes; a lane collapses from its header.">
        <Taskboard v-model:columns="columns" v-model:items="tasks" column-field="status" lane-field="team" :reorder-columns="false" style="width: 100%" scroll-height="14rem">
            <template #lane-header="{ lane, count }">
                <strong>{{ lane.title }}</strong>
                <span class="demo-hint">{{ count }} tasks</span>
            </template>
        </Taskboard>
    </DemoSection>

    <DemoSection title="Nested columns" description="Columns that carry their own cards (v-model:columns). Later starts collapsed but still takes drops; Frozen is locked, and its card is disabled.">
        <Taskboard v-model:columns="nested" style="width: 100%">
            <template #column-footer="{ count }">
                <small class="demo-hint">{{ count }} in this column</small>
            </template>
        </Taskboard>
    </DemoSection>

    <DemoSection title="canDrop" description="A hook has the last word: here only high-priority tasks may go to Done from anywhere but In progress.">
        <Taskboard v-model:columns="columns" v-model:items="tasks" column-field="status" :can-drop="canDrop" style="width: 100%" />
    </DemoSection>
</template>
