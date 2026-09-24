<script setup lang="ts">
import { PickList } from '@vitral/vue';
import { ref } from 'vue';

interface Skill {
    name: string;
    icon: string;
}

const lists = ref<[Skill[], Skill[]]>([
    [
        { name: 'Design', icon: 'pencil' },
        { name: 'Research', icon: 'search' },
        { name: 'Writing', icon: 'file' },
        { name: 'Analytics', icon: 'sliders' },
        { name: 'Support', icon: 'bell' }
    ],
    [{ name: 'Engineering', icon: 'grip' }]
]);
</script>

<template>
    <PickList v-model="lists" option-label="name" data-key="name" source-header="Available skills" target-header="Your skills" scroll-height="14rem">
        <template #option="{ item }">
            <span style="display: inline-flex; align-items: center; gap: 0.5rem">{{ (item as Skill).name }}</span>
        </template>
    </PickList>
    <small style="color: var(--vt-text-muted-color)">Your skills: {{ lists[1].map((s) => s.name).join(', ') || 'none' }}</small>
</template>
