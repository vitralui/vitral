<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();
let n = 0;

function upload() {
    n++;
    toast.add({ group: 'collapse', collapseKey: 'upload', severity: 'success', summary: 'File uploaded', detail: `photo-${n}.jpg`, life: 4000 });
}
</script>

<template>
    <Toast group="collapse" position="top-center" />
    <Button label="Upload a file" severity="secondary" @click="upload" />
</template>
