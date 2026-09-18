<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ConfirmPopup',
    category: 'Overlay',
    description:
        'The confirmation anchored to what it is about. `useConfirm().require({ target })` opens it as a WAI-ARIA alertdialog, described by its message, with focus on the default answer and kept inside until the question is answered. A request without a target goes to `<ConfirmDialog>` instead.'
};
</script>

<script setup lang="ts">
import { Button, ConfirmPopup, useConfirm } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    <DemoSection title="Basic">
        <ConfirmPopup />
        <Button label="Save" icon="check" @click="save" />
        <Button label="Delete" icon="trash" severity="danger" variant="outlined" @click="remove" />
        <span class="demo-hint">Last answer: {{ status }}</span>
    </DemoSection>
</template>
