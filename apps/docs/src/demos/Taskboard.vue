<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Taskboard',
    category: 'Data',
    description: 'A kanban board of cards in columns and swimlanes, dragged by mouse, touch or keyboard, with work-in-progress limits.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Taskboard/Basic.vue';
import Filtered from './Taskboard/Filtered.vue';
import CanDrop from './Taskboard/CanDrop.vue';
import NestedColumns from './Taskboard/NestedColumns.vue';
import Summaries from './Taskboard/Summaries.vue';
import Swimlanes from './Taskboard/Swimlanes.vue';
</script>

<template>
    <DemoSection title="Basic" description="A flat list of tasks, each naming its column. In progress holds two at most."><Basic /></DemoSection>
    <DemoSection title="Swimlanes" description="The same tasks split by team. Page Up and Page Down carry a picked-up card between lanes; a lane collapses from its header."><Swimlanes /></DemoSection>
    <DemoSection title="Nested columns" description="Columns that carry their own cards (v-model:columns). Later starts collapsed but still takes drops; Frozen is locked, and its card is disabled."><NestedColumns /></DemoSection>
    <DemoSection title="A figure per column" description="`summary` adds up a field of each column's cards — the story points here — and shows it beside the count, as it does beside each lane's. `type` makes it an average, a minimum or a maximum, and `format` words it. Move a card and the figures follow."><Summaries /></DemoSection>
    <DemoSection title="canDrop" description="A hook has the last word: here only high-priority tasks may go to Done from anywhere but In progress."><CanDrop /></DemoSection>
    <DemoSection title="Filtered" description="`filter` shows only some cards: words, looked for in each card's text and numbers with case and accents aside (“revisao” finds Revisão), or a function that keeps a card. The counts are of the cards shown. While a filter hides some cards they cannot be dragged — a drop between two visible cards would say nothing about where it goes among the hidden ones — and picking one up says so."><Filtered /></DemoSection>
</template>
