<script setup lang="ts">
import { Button, EmptyState } from '@vitral/vue';
</script>

<template>
    <div style="width: 100%; display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1rem">
        <EmptyState severity="success" title="Payment received" description="A receipt is on its way to your email.">
            <template #actions><Button label="Back to orders" /></template>
        </EmptyState>
        <EmptyState severity="danger" title="The upload failed" description="The file is larger than 20 MB.">
            <template #actions><Button label="Try another file" severity="danger" variant="outlined" /></template>
        </EmptyState>
    </div>
</template>
