<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'OrganizationChart',
    category: 'Data',
    description:
        'A tree drawn as a chart, and announced as a WAI-ARIA tree: the arrows walk the nodes in reading order and fold or open them, Enter selects. A slot named after a node’s `type` renders that kind of node.'
};
</script>

<script setup lang="ts">
import { Avatar, OrganizationChart, type OrganizationChartNode } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    <DemoSection title="Selectable and collapsible" class="stack">
        <OrganizationChart v-model:selection-keys="selection" :value="chart" selection-mode="single" collapsible aria-label="Company">
            <template #person="{ node }">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.25rem; min-width: 7rem">
                    <Avatar :label="(node.data as { initials: string }).initials" shape="circle" />
                    <strong>{{ (node.data as { name: string }).name }}</strong>
                    <small class="demo-hint">{{ (node.data as { title: string }).title }}</small>
                </div>
            </template>
        </OrganizationChart>
        <span class="demo-hint">Selected: {{ Object.keys(selection).join(', ') || 'none' }}</span>
    </DemoSection>
</template>
