<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ConfirmDialog',
    category: 'Overlay',
    description:
        'Ask before acting: `useConfirm().require({ message, header, accept, reject })` opens it from anywhere. It is a WAI-ARIA alertdialog described by its message; `defaultFocus: \'reject\'` keeps a stray Enter from deleting anything.'
};
</script>

<script setup lang="ts">
import { Button, ConfirmDialog, Toast, useConfirm, useToast } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

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

function plain() {
    confirm.require({ message: 'Leave without saving?', accept: () => toast.add({ summary: 'Left the page', life: 2000 }) });
}
</script>

<template>
    <ConfirmDialog />
    <Toast />
    <DemoSection title="Severity" description="The icon and the accept button take the severity’s colour.">
        <Button label="Delete file" icon="trash" severity="danger" @click="remove" />
        <Button label="Publish" icon="upload" @click="publish" />
    </DemoSection>
    <DemoSection title="Without a header" description="The labels come from the locale and the dialog is named “Confirmation”.">
        <Button label="Leave page" severity="secondary" @click="plain" />
    </DemoSection>
</template>
