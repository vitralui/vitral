<script lang="ts">
import type { GuideMeta } from '../lib/guides';

export const meta: GuideMeta = {
    title: 'A board that saves every move',
    section: 'Recipes',
    description: 'A Taskboard over your own records: a card moves at once, the server is told, and if it says no the board goes back to what the server has.'
};
</script>

<script setup lang="ts">
import { T } from '../lib/i18n';
import { href } from '../lib/router';
import CodeBlock from '../parts/CodeBlock.vue';
import SavingBoard from './recipes/SavingBoard.vue';

const board = `<script setup lang="ts">
import { Taskboard, type TaskboardCardMoveEvent } from '@vitral/vue';
import { ref } from 'vue';

const columns = ref([
    { key: 'todo', title: 'To do' },
    { key: 'doing', title: 'Doing' },
    { key: 'done', title: 'Done' }
]);
const items = ref(await api.tasks());

// The list as the server last agreed to it.
let saved = items.value;

async function onMove(event: TaskboardCardMoveEvent) {
    try {
        await api.moveTask(event.item.id, { status: event.to.column, position: event.to.index });
        saved = items.value;
    } catch {
        items.value = saved;
        toast.add({ severity: 'warn', summary: 'The card is back where it was.' });
    }
}
<\/script>

<template>
    <Taskboard v-model:columns="columns" v-model:items="items" column-field="status" card-label="title" @card-move="onMove" />
</template>`;

const rules = `<Taskboard
    v-model:columns="columns"
    v-model:items="items"
    column-field="status"
    :can-drop="({ item, to }) => to.column !== 'done' || item.approved"
    locked-field="archived"
    @drop-refused="({ reason }) => reason === 'canDrop' && toast.add({ summary: 'Approve it first.' })"
/>`;

const limits = `const columns = ref([
    { key: 'todo', title: 'To do' },
    // Three at most: at three it looks full, and a fourth card is refused.
    { key: 'doing', title: 'Doing', wipLimit: 3 },
    { key: 'done', title: 'Done' }
]);`;
</script>

<template>
    <T k="intro">
        The board moves a card the moment it is let go, so the reader is never kept waiting on the network. The server is told after, and the list as the server last
        agreed to it is kept beside the board: if the server says no, that list goes back. Turn on the switch below and move a card to see it come back.
    </T>

    <div class="recipe-live">
        <SavingBoard />
    </div>

    <T k="move.title" as="h2">Save on the move</T>
    <T k="move.body" as="p">
        <code>v-model:items</code> has the new list before <code>card-move</code> is emitted, so the board already shows the move when you are told about it. The event
        carries the card, where it came <code>from</code> and where it went <code>to</code>: a column, a lane when the board has them, and a place in the column.
    </T>
    <CodeBlock :code="board" label="Board.vue" lang="vue" />

    <T k="rules.title" as="h2">Refuse before the drop</T>
    <T k="rules.body" as="p">
        What the server would refuse for a reason the page already knows is better refused on the board: <code>can-drop</code> is asked while the card is over a column, and
        the column shows it will not take it; <code>locked-field</code> keeps a card in place; <code>drop-refused</code> says why, for a message.
    </T>
    <CodeBlock :code="rules" label="Board.vue" lang="vue" />

    <T k="limits.title" as="h2">Limits on a column</T>
    <T k="limits.body" as="p">
        A column's <code>wipLimit</code> is how many cards it takes. At the limit it looks full and refuses more, with <code>drop-refused</code> and
        <code>reason: 'wip'</code>, and the
        <a :href="href('/components/taskboard')">Taskboard page</a> has the rest: lanes, a summary per column and keyboard moves.
    </T>
    <CodeBlock :code="limits" label="columns.ts" lang="ts" />
</template>
