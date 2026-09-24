<script setup lang="ts">
import { ContextMenu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

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
    <div
        id="ctx-target"
        tabindex="0"
        style="padding: 2rem; text-align: center; border: 1px dashed var(--vt-content-border-color); border-radius: 8px"
        aria-describedby="ctx-hint"
    >
        report.pdf
    </div>
    <small id="ctx-hint" style="color: var(--vt-text-muted-color)">Right-click it, or focus it and press Shift+F10. Last command: {{ last }}</small>
    <ContextMenu :model="items" target="#ctx-target" aria-label="File actions" />
</template>
