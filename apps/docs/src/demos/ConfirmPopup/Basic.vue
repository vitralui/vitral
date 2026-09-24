<script setup lang="ts">
import { Button, ConfirmPopup, useConfirm } from '@vitral/vue';
import { ref } from 'vue';

const confirm = useConfirm();
const status = ref('—');

function save(event: MouseEvent) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        message: 'Save your changes before leaving?',
        icon: 'info',
        accept: () => (status.value = 'Saved'),
        reject: () => (status.value = 'Discarded'),
        onHide: () => (status.value = 'Dismissed')
    });
}

function remove(event: MouseEvent) {
    confirm.require({
        target: event.currentTarget as HTMLElement,
        header: 'Delete record',
        message: 'This cannot be undone.',
        severity: 'danger',
        acceptLabel: 'Delete',
        rejectLabel: 'Keep',
        defaultFocus: 'reject',
        accept: () => (status.value = 'Deleted'),
        reject: () => (status.value = 'Kept')
    });
}
</script>

<template>
    <ConfirmPopup />
    <Button label="Save" icon="check" @click="save" />
    <Button label="Delete" icon="trash" severity="danger" variant="outlined" @click="remove" />
    <small style="color: var(--vt-text-muted-color)">Last answer: {{ status }}</small>
</template>
