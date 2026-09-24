<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();
const severities = [
    { severity: 'success', summary: 'Saved', detail: 'Your changes are live.' },
    { severity: 'info', summary: 'Update available', detail: 'Restart to install version 2.4.' },
    { severity: 'warn', summary: 'Storage almost full', detail: '92% of 15 GB used.' },
    { severity: 'danger', summary: 'Upload failed', detail: 'The connection was reset.' },
    { severity: 'secondary', summary: 'Synced', detail: 'Everything is up to date.' },
    { severity: 'contrast', summary: 'Copied', detail: 'The link is on your clipboard.' }
] as const;

// A group of its own, so only this example's <Toast> shows these messages
// when another <Toast> is on the page.
function show(index: number) {
    toast.add({ ...severities[index]!, group: 'severities', life: 4000 });
}
</script>

<template>
    <Toast group="severities" />
    <Button v-for="(s, i) in severities" :key="s.severity" :label="s.severity" severity="secondary" @click="show(i)" />
</template>
