<script setup lang="ts">
import { SplitButton, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

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
    <SplitButton label="Save" icon="check" :model="items" @click="last = 'Save'" />
    <small style="color: var(--vt-text-muted-color)">Last command: {{ last }}</small>
</template>
