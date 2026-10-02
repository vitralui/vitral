<script setup lang="ts">
import { Button, Toast, useToast } from '@vitral/vue';

const toast = useToast();

// Stands in for a request: half the time it fails.
const upload = () => new Promise<number>((resolve, reject) => setTimeout(() => (Math.random() < 0.5 ? resolve(3) : reject(new Error('The server is busy.'))), 1500));

function send() {
    toast
        .promise(upload(), {
            loading: { group: 'promise', summary: 'Uploading 3 files' },
            success: (count) => ({ summary: `${count} files uploaded` }),
            error: (error) => ({ summary: 'Upload failed', detail: (error as Error).message })
        })
        .catch(() => {});
}
</script>

<template>
    <Toast group="promise" position="bottom-center" />
    <Button label="Upload" severity="secondary" @click="send" />
</template>
