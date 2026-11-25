<script setup lang="ts">
import { Message, Taskboard, ToggleSwitch, type TaskboardCardMoveEvent, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';

interface Task {
    id: number;
    title: string;
    status: string;
}

const columns = ref<TaskboardColumn[]>([
    { key: 'todo', title: 'To do' },
    { key: 'doing', title: 'Doing' },
    { key: 'done', title: 'Done' }
]);

const items = ref<Task[]>([
    { id: 1, title: 'Write the brief', status: 'todo' },
    { id: 2, title: 'Pick the fabric', status: 'todo' },
    { id: 3, title: 'Cut the pattern', status: 'doing' },
    { id: 4, title: 'Order the buttons', status: 'done' }
]);

// The list as the server last agreed to it.
let saved = items.value;
const offline = ref(false);
const saving = ref(0);
const failed = ref<string | null>(null);

// A stand-in for `fetch(..., { method: 'PATCH' })`: 600 ms, and a refusal while the switch is on.
function patch(task: Task, status: string, position: number) {
    void task, status, position;
    return new Promise<void>((resolve, reject) => setTimeout(() => (offline.value ? reject(new Error('offline')) : resolve()), 600));
}

async function onMove(event: TaskboardCardMoveEvent) {
    const task = event.item as Task;
    failed.value = null;
    saving.value++;
    try {
        await patch(task, String(event.to.column), event.to.index);
        saved = items.value;
    } catch {
        // The board goes back to what the server has, and says so.
        items.value = saved;
        failed.value = `“${task.title}” could not be moved. It is back where it was.`;
    } finally {
        saving.value--;
    }
}
</script>

<template>
    <div class="recipe-bar">
        <ToggleSwitch v-model="offline" label="The server refuses" />
        <small aria-live="polite">{{ saving ? 'Saving…' : 'Saved' }}</small>
    </div>
    <Message v-if="failed" severity="warn" closable class="recipe-message" @close="failed = null">{{ failed }}</Message>
    <Taskboard v-model:columns="columns" v-model:items="items" column-field="status" card-label="title" min-height="14rem" @card-move="onMove" />
</template>

<style scoped>
.recipe-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.recipe-bar small {
    color: var(--vt-text-muted-color);
}

.recipe-message {
    margin-bottom: 0.75rem;
}
</style>
