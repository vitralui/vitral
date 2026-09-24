<script setup lang="ts">
import { Timeline } from '@vitral/vue';

const events = [
    { status: 'Ordered', date: '15/10/2026 10:30', icon: 'file' },
    { status: 'Processing', date: '15/10/2026 14:00', icon: 'refresh' },
    { status: 'Shipped', date: '16/10/2026 16:15', icon: 'upload' },
    { status: 'Delivered', date: '18/10/2026 10:00', icon: 'check' }
];
</script>

<template>
    <Timeline :value="events" layout="horizontal" align="top" aria-label="Order steps" style="width: 100%">
        <template #content="{ item }">{{ (item as { status: string }).status }}</template>
    </Timeline>
</template>
