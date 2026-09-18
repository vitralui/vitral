<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Timeline',
    category: 'Data',
    description: 'Events on an axis, down the page or across it, with content on one side, the other, or alternating. It is an ordered list; the markers and the line are drawing.'
};
</script>

<script setup lang="ts">
import { Icon, Timeline } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const events = [
    { status: 'Ordered', date: '15/10/2026 10:30', icon: 'file' },
    { status: 'Processing', date: '15/10/2026 14:00', icon: 'refresh' },
    { status: 'Shipped', date: '16/10/2026 16:15', icon: 'upload' },
    { status: 'Delivered', date: '18/10/2026 10:00', icon: 'check' }
];
</script>

<template>
    <DemoSection title="Opposite content">
        <Timeline :value="events" aria-label="Order history" style="width: 100%">
            <template #opposite="{ item }">
                <small class="demo-hint">{{ (item as { date: string }).date }}</small>
            </template>
            <template #content="{ item }">{{ (item as { status: string }).status }}</template>
        </Timeline>
    </DemoSection>
    <DemoSection title="Alternate, with icons">
        <Timeline :value="events" align="alternate" aria-label="Order history, alternating" style="width: 100%">
            <template #marker="{ item }">
                <span style="display: flex; width: 2rem; height: 2rem; align-items: center; justify-content: center; border-radius: 50%; color: var(--vt-primary-contrast-color); background: var(--vt-primary-color)">
                    <Icon :icon="(item as { icon: string }).icon" />
                </span>
            </template>
            <template #content="{ item }">
                <strong>{{ (item as { status: string }).status }}</strong>
                <div class="demo-hint">{{ (item as { date: string }).date }}</div>
            </template>
        </Timeline>
    </DemoSection>
    <DemoSection title="Horizontal">
        <Timeline :value="events" layout="horizontal" align="top" aria-label="Order steps" style="width: 100%">
            <template #content="{ item }">{{ (item as { status: string }).status }}</template>
        </Timeline>
    </DemoSection>
</template>
