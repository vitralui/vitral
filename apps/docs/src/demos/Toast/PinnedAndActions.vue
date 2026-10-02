<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();

function update() {
    toast.add({
        group: 'actions',
        id: 'update',
        pinned: true,
        severity: 'info',
        summary: 'A new version is ready',
        detail: 'Reload to use it.',
        actions: [
            { label: 'Reload', severity: 'primary', onClick: () => toast.add({ group: 'actions', severity: 'success', summary: 'Reloaded', life: 2000 }) },
            { label: 'Later' }
        ]
    });
}

function remove() {
    toast.add({
        group: 'actions',
        severity: 'secondary',
        summary: 'Message deleted',
        life: 6000,
        progress: true,
        actions: [{ label: 'Undo', onClick: () => toast.add({ group: 'actions', severity: 'success', summary: 'Restored', life: 2000 }) }]
    });
}
</script>

<template>
    <Toast group="actions" position="top-right" />
    <Button label="Pinned, with actions" severity="secondary" @click="update" />
    <Button label="Undo, with a progress bar" severity="secondary" @click="remove" />
</template>
