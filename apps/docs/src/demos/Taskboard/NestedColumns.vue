<script setup lang="ts">
import { Taskboard, type TaskboardColumn } from '@vitral/vue';
import { ref } from 'vue';

const nested = ref<TaskboardColumn[]>([
    { key: 'ideas', title: 'Ideas', items: [{ id: 'a', title: 'Dark mode for charts' }, { id: 'b', title: 'Right-to-left layout' }] },
    { key: 'next', title: 'Next', items: [{ id: 'c', title: 'Nuxt module' }] },
    { key: 'later', title: 'Later', collapsed: true, items: [{ id: 'd', title: 'Angular adapter' }, { id: 'e', title: 'React adapter' }] },
    { key: 'frozen', title: 'Frozen', locked: true, items: [{ id: 'f', title: 'IE support', disabled: true }] }
]);
</script>

<template>
    <Taskboard v-model:columns="nested" style="width: 100%">
        <template #column-footer="{ count }">
            <small style="color: var(--vt-text-muted-color)">{{ count }} in this column</small>
        </template>
    </Taskboard>
</template>
