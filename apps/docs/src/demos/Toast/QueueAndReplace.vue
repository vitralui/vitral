<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();
const batch = (group: string) =>
    ['Invoice 1041', 'Invoice 1042', 'Invoice 1043', 'Invoice 1044', 'Invoice 1045'].map((name) => ({ group, severity: 'success' as const, summary: 'Sent', detail: name, life: 2500 }));
</script>

<template>
    <Toast group="queue" position="top-left" :max="3" />
    <Toast group="replace" position="bottom-left" :max="3" overflow="replace" />
    <Button label="Five at once, queued" severity="secondary" @click="toast.add(batch('queue'))" />
    <Button label="Five at once, replacing" severity="secondary" @click="toast.add(batch('replace'))" />
</template>
