<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();

// Each <Toast> has a group, so it shows only the messages sent to it
// when another <Toast> is on the page.
function sticky() {
    toast.add({ group: 'sticky', severity: 'info', summary: 'Stays until closed', detail: 'No life, so it waits for you.' });
}

function bottom() {
    toast.add({ group: 'bc', severity: 'success', summary: 'Message sent', life: 3000 });
}
</script>

<template>
    <Toast group="sticky" />
    <Toast position="bottom-center" group="bc" />
    <Button label="Sticky" severity="secondary" @click="sticky" />
    <Button label="Bottom centre" severity="secondary" @click="bottom" />
    <Button label="Clear all" severity="secondary" variant="outlined" @click="toast.removeAll()" />
</template>
