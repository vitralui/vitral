<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Toast',
    category: 'Messages',
    description:
        'Notifications sent with `useToast().add({ severity, summary, detail, life })` and shown by the `<Toast>` with the same `group`. Each is a live region — polite, or an alert for `danger` — and a `life` pauses while the card is hovered or focused.'
};
</script>

<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const toast = useToast();
const severities = [
    { severity: 'success', summary: 'Saved', detail: 'Your changes are live.' },
    { severity: 'info', summary: 'Update available', detail: 'Restart to install version 2.4.' },
    { severity: 'warn', summary: 'Storage almost full', detail: '92% of 15 GB used.' },
    { severity: 'danger', summary: 'Upload failed', detail: 'The connection was reset.' },
    { severity: 'secondary', summary: 'Synced', detail: 'Everything is up to date.' },
    { severity: 'contrast', summary: 'Copied', detail: 'The link is on your clipboard.' }
] as const;

function show(index: number) {
    toast.add({ ...severities[index]!, life: 4000 });
}

function sticky() {
    toast.add({ severity: 'info', summary: 'Stays until closed', detail: 'No life, so it waits for you.' });
}

function bottom() {
    toast.add({ group: 'bc', severity: 'success', summary: 'Message sent', life: 3000 });
}
</script>

<template>
    <Toast />
    <Toast position="bottom-center" group="bc" />
    <DemoSection title="Severities" description="Four seconds each; hover one to keep it.">
        <Button v-for="(s, i) in severities" :key="s.severity" :label="s.severity" severity="secondary" @click="show(i)" />
    </DemoSection>
    <DemoSection title="Sticky and grouped" description="Without a `life` a toast waits to be closed. A `group` sends it to another `<Toast>` — here, one at the bottom.">
        <Button label="Sticky" severity="secondary" @click="sticky" />
        <Button label="Bottom centre" severity="secondary" @click="bottom" />
        <Button label="Clear all" severity="secondary" variant="outlined" @click="toast.removeAll()" />
    </DemoSection>
</template>
