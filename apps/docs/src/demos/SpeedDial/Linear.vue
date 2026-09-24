<script setup lang="ts">
import { SpeedDial, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const last = ref('—');
const actions: MenuItem[] = [
    { label: 'Add', icon: 'plus', command: () => (last.value = 'Add') },
    { label: 'Edit', icon: 'pencil', command: () => (last.value = 'Edit') },
    { label: 'Copy', icon: 'copy', command: () => (last.value = 'Copy') },
    { label: 'Delete', icon: 'trash', command: () => (last.value = 'Delete') }
];
</script>

<template>
    <div style="display: flex; gap: 6rem; align-items: center; padding: 11rem 8rem 1rem">
        <SpeedDial :model="actions" direction="up" aria-label="Actions (up)" />
        <SpeedDial :model="actions" direction="right" aria-label="Actions (right)" severity="secondary" />
    </div>
    <small style="color: var(--vt-text-muted-color)">Last action: {{ last }}</small>
</template>
