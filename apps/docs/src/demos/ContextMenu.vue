<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ContextMenu',
    category: 'Menu',
    description:
        'The menu a right-click opens — and Shift+F10 or the context-menu key, for the keyboard. It opens at the pointer (or under the focused element) on its first item, works as a WAI-ARIA menu with submenus, and gives focus back when it closes.'
};
</script>

<script setup lang="ts">
import { ContextMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const run = ({ item }: { item: MenuItem }) => (last.value = item.label ?? '');
const items: MenuItem[] = [
    { label: 'Open', icon: 'folderOpen', command: run },
    { label: 'Rename', icon: 'pencil', command: run },
    { label: 'Share', icon: 'externalLink', items: [{ label: 'Email', command: run }, { label: 'Copy link', icon: 'copy', command: run }] },
    { separator: true },
    { label: 'Delete', icon: 'trash', command: run }
];
</script>

<template>
    <DemoSection title="On an element" class="stack">
        <div
            id="ctx-target"
            tabindex="0"
            style="padding: 2rem; text-align: center; border: 1px dashed var(--vt-content-border-color); border-radius: 8px"
            aria-describedby="ctx-hint"
        >
            report.pdf
        </div>
        <span id="ctx-hint" class="demo-hint">Right-click it, or focus it and press Shift+F10. Last command: {{ last }}</span>
        <ContextMenu :model="items" target="#ctx-target" aria-label="File actions" />
    </DemoSection>
</template>
