<script setup lang="ts">
import { Avatar, OrganizationChart, type OrganizationChartNode } from '@vitral/vue';
import { ref } from 'vue';

const chart: OrganizationChartNode = {
    key: 'ceo',
    type: 'person',
    data: { name: 'Ana Lima', title: 'CEO', initials: 'AL' },
    children: [
        {
            key: 'cto',
            type: 'person',
            data: { name: 'Bruno Costa', title: 'CTO', initials: 'BC' },
            children: [
                { key: 'web', label: 'Web' },
                { key: 'mobile', label: 'Mobile' }
            ]
        },
        {
            key: 'cfo',
            type: 'person',
            data: { name: 'Carla Dias', title: 'CFO', initials: 'CD' },
            children: [{ key: 'finance', label: 'Finance' }]
        },
        { key: 'ops', label: 'Operations', collapsible: false }
    ]
};

const selection = ref<Record<string, boolean>>({});
</script>

<template>
    <OrganizationChart v-model:selection-keys="selection" :value="chart" selection-mode="single" collapsible aria-label="Company">
        <template #person="{ node }">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem; min-width: 7rem">
                <Avatar :label="(node.data as { initials: string }).initials" shape="circle" />
                <strong>{{ (node.data as { name: string }).name }}</strong>
                <small style="color: var(--vt-text-muted-color)">{{ (node.data as { title: string }).title }}</small>
            </div>
        </template>
    </OrganizationChart>
    <small style="color: var(--vt-text-muted-color)">Selected: {{ Object.keys(selection).join(', ') || 'none' }}</small>
</template>
