<script setup lang="ts">
import { Button, ConfirmDialog, Toast, useConfirm, useToast } from '@vitral/vue';

const confirm = useConfirm();
const toast = useToast();

function remove() {
    confirm.require({
        header: 'Delete “Quarterly report.xlsx”?',
        message: 'The file moves to the recycle bin for 30 days, then it is gone for good.',
        severity: 'danger',
        acceptLabel: 'Delete',
        rejectLabel: 'Cancel',
        defaultFocus: 'reject',
        accept: () => toast.add({ severity: 'success', summary: 'Deleted', detail: 'Quarterly report.xlsx', life: 3000 }),
        reject: () => toast.add({ severity: 'secondary', summary: 'Kept', detail: 'Nothing was deleted.', life: 3000 })
    });
}

function publish() {
    confirm.require({
        header: 'Publish changes?',
        message: 'Everyone with access will see the new version.',
        severity: 'info',
        acceptLabel: 'Publish',
        rejectLabel: 'Not now',
        accept: () => toast.add({ severity: 'info', summary: 'Published', life: 3000 })
    });
}
</script>

<template>
    <ConfirmDialog />
    <Toast />
    <Button label="Delete file" icon="trash" severity="danger" @click="remove" />
    <Button label="Publish" icon="upload" @click="publish" />
</template>
