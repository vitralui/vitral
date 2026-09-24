<script setup lang="ts">
import { Icon, Timeline } from '@vitral/vue';

const events = [
    { status: 'Ordered', date: '15/10/2026 10:30', icon: 'file' },
    { status: 'Processing', date: '15/10/2026 14:00', icon: 'refresh' },
    { status: 'Shipped', date: '16/10/2026 16:15', icon: 'upload' },
    { status: 'Delivered', date: '18/10/2026 10:00', icon: 'check' }
];
</script>

<template>
    <Timeline :value="events" align="alternate" aria-label="Order history, alternating" style="width: 100%">
        <template #marker="{ item }">
            <span style="display: flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border-radius: 50%; color: var(--vt-primary-contrast-color); background: var(--vt-primary-color)">
                <Icon :icon="(item as { icon: string }).icon" />
            </span>
        </template>
        <template #content="{ item }">
            <strong>{{ (item as { status: string }).status }}</strong>
            <div style="font-size: 0.75rem; color: var(--vt-text-muted-color)">{{ (item as { date: string }).date }}</div>
        </template>
    </Timeline>
</template>
