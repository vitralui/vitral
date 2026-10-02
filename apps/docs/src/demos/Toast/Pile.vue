<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();
const severities = ['info', 'success', 'warn', 'danger'] as const;
let n = 0;

function send() {
    n++;
    toast.add({ group: 'pile', severity: severities[n % 4], summary: `Notification ${n}`, detail: 'Point at the pile to spread it.', life: 6000 });
}
</script>

<template>
    <Toast group="pile" position="bottom-right" stacked show-progress />
    <Button label="Add to the pile" severity="secondary" @click="send" />
</template>
