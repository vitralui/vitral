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
    <SplitButton label="Small" :model="items" size="small" />
    <SplitButton label="Large" :model="items" size="large" />
    <SplitButton label="Saving" :model="items" loading />
    <SplitButton label="Disabled" :model="items" disabled />
</template>
