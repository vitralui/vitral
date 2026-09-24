<script setup lang="ts">
import { SpeedDial, type MenuItem } from '@vitral/vue';

const actions: MenuItem[] = [
    { label: 'Add', icon: 'plus' },
    { label: 'Edit', icon: 'pencil' },
    { label: 'Copy', icon: 'copy' },
    { label: 'Delete', icon: 'trash' }
];
</script>

<template>
    <div style="display: flex; gap: 12rem; align-items: center; padding: 6rem 7rem">
        <SpeedDial :model="actions" type="circle" :radius="80" aria-label="Actions (circle)" severity="help" />
        <SpeedDial :model="actions" type="semi-circle" direction="up" :radius="90" hide-icon="close" aria-label="Actions (semi-circle)" severity="success" />
    </div>
</template>
