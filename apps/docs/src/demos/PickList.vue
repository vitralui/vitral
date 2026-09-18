<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'PickList',
    category: 'Data',
    description:
        'Two lists and the moves between them. Select items and send them across with the buttons, Enter or a double click; reorder within a list with Alt and the arrows. Every move is announced.'
};
</script>

<script setup lang="ts">
import { PickList } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    <DemoSection title="Basic" class="stack">
        <PickList v-model="lists" option-label="name" data-key="name" source-header="Available skills" target-header="Your skills" scroll-height="14rem">
            <template #option="{ item }">
                <span style="display: inline-flex; align-items: center; gap: 0.5rem">{{ (item as Skill).name }}</span>
            </template>
        </PickList>
        <span class="demo-hint">Your skills: {{ lists[1].map((s) => s.name).join(', ') || 'none' }}</span>
    </DemoSection>
</template>
