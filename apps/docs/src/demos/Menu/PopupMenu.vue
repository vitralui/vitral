<script setup lang="ts">
import { Button, Menu, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';

const actions: MenuItem[] = [
    { label: 'Rename', icon: 'pencil' },
    { label: 'Copy', icon: 'copy' },
    { label: 'Download', icon: 'download' },
    { separator: true },
    { label: 'Delete', icon: 'trash' }
];

const popup = ref<InstanceType<typeof Menu> | null>(null);
const open = ref(false);
</script>

<template>
    <Button
        label="Actions"
        icon="moreVertical"
        severity="secondary"
        aria-haspopup="menu"
        :aria-expanded="open"
        :aria-controls="open ? 'demo-actions-menu' : undefined"
        @click="popup?.toggle($event)"
    />
    <Menu id="demo-actions-menu" ref="popup" :model="actions" popup @show="open = true" @hide="open = false" />
</template>
