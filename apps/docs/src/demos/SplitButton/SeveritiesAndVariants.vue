<script setup lang="ts">
import { SplitButton, type MenuItem } from '@vitral/vue';

const items: MenuItem[] = [
    { label: 'Save as draft', icon: 'file' },
    { label: 'Save and close', icon: 'check' },
    { separator: true },
    { label: 'Export', icon: 'download' },
    { label: 'Delete', icon: 'trash', disabled: true }
];
</script>

<template>
    <SplitButton label="Save" :model="items" severity="secondary" />
    <SplitButton label="Save" :model="items" severity="success" rounded />
    <SplitButton label="Save" :model="items" severity="danger" variant="outlined" />
    <SplitButton label="Save" :model="items" variant="text" raised />
</template>
