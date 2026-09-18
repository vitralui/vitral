<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Dock',
    category: 'Menu',
    description:
        'A strip of large icons that grow under the pointer. It is a WAI-ARIA menu with one tab stop: the arrows along the dock move, Home and End jump, Enter runs an item. Each item is named by its label, also shown as a tooltip.'
};
</script>

<script setup lang="ts">
import { Dock, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const apps: MenuItem[] = [
    { label: 'Files', icon: 'folder', command: run },
    { label: 'Calendar', icon: 'calendar', command: run },
    { label: 'Notifications', icon: 'bell', command: run },
    { label: 'Settings', icon: 'sliders', command: run },
    { label: 'Downloads', icon: 'download', command: run },
    { label: 'Trash', icon: 'trash', command: run }
];
</script>

<template>
    <DemoSection title="Bottom" class="stack">
        <div style="display: flex; align-items: flex-end; justify-content: center; height: 10rem; border-radius: 8px; background: linear-gradient(135deg, var(--vt-primary-100), var(--vt-primary-300))">
            <Dock :model="apps" aria-label="Apps" style="margin-bottom: 0.75rem" />
        </div>
        <span class="demo-hint">Last opened: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Left">
        <Dock :model="apps" position="left" aria-label="Apps (vertical)" />
    </DemoSection>
</template>
