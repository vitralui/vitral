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
import CanDrop from './Taskboard/CanDrop.vue';
import NestedColumns from './Taskboard/NestedColumns.vue';
import Swimlanes from './Taskboard/Swimlanes.vue';
</script>

<template>
    <DemoSection title="Basic" description="A flat list of tasks, each naming its column. In progress holds two at most."><Basic /></DemoSection>
    <DemoSection title="Swimlanes" description="The same tasks split by team. Page Up and Page Down carry a picked-up card between lanes; a lane collapses from its header."><Swimlanes /></DemoSection>
    <DemoSection title="Nested columns" description="Columns that carry their own cards (v-model:columns). Later starts collapsed but still takes drops; Frozen is locked, and its card is disabled."><NestedColumns /></DemoSection>
    <DemoSection title="canDrop" description="A hook has the last word: here only high-priority tasks may go to Done from anywhere but In progress."><CanDrop /></DemoSection>
</template>
