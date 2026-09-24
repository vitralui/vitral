<script setup lang="ts">
import { Button, ConfirmDialog, Toast, useConfirm, useToast } from '@vitral/vue';

const confirm = useConfirm();
const toast = useToast();

// A group of its own, so this dialog and its toasts answer only these calls
// when another <ConfirmDialog> or <Toast> is on the page.
function plain() {
    confirm.require({ group: 'leave', message: 'Leave without saving?', accept: () => toast.add({ group: 'leave', summary: 'Left the page', life: 2000 }) });
}
</script>

<template>
    <ConfirmDialog group="leave" />
    <Toast group="leave" />
    <Button label="Leave page" severity="secondary" @click="plain" />
</template>
