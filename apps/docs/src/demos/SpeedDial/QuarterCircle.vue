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
    <div style="display: flex; justify-content: flex-end; width: 100%; padding: 7rem 1rem 1rem">
        <SpeedDial :model="actions" type="quarter-circle" direction="up-left" :radius="110" aria-label="Actions (quarter)" severity="contrast" />
    </div>
</template>
