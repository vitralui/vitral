<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SplitButton',
    category: 'Button',
    description:
        'A command with a menu of related commands welded to it. The menu button follows the WAI-ARIA menu button pattern: Enter, Space or Down opens the menu on its first item, Up on its last; Escape, Tab or a choice closes it and gives focus back.'
};
</script>

<script setup lang="ts">
import { SplitButton, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const items: MenuItem[] = [
    { label: 'Save as draft', icon: 'file', command: () => (last.value = 'Save as draft') },
    { label: 'Save and close', icon: 'check', command: () => (last.value = 'Save and close') },
    { separator: true },
    { label: 'Export', icon: 'download', command: () => (last.value = 'Export') },
    { label: 'Delete', icon: 'trash', disabled: true }
];
</script>

<template>
    <DemoSection title="Basic">
        <SplitButton label="Save" icon="check" :model="items" @click="last = 'Save'" />
        <span class="demo-hint">Last command: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Severities and variants">
        <SplitButton label="Save" :model="items" severity="secondary" />
        <SplitButton label="Save" :model="items" severity="success" rounded />
        <SplitButton label="Save" :model="items" severity="danger" variant="outlined" />
        <SplitButton label="Save" :model="items" variant="text" raised />
    </DemoSection>
    <DemoSection title="Sizes and states">
        <SplitButton label="Small" :model="items" size="small" />
        <SplitButton label="Large" :model="items" size="large" />
        <SplitButton label="Saving" :model="items" loading />
        <SplitButton label="Disabled" :model="items" disabled />
    </DemoSection>
</template>
