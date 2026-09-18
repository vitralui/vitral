<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Card',
    category: 'Panel',
    description: 'A container for one piece of content: an optional header image, a title and subtitle, the content and a footer of actions. It is the layer fill over the page with a hairline stroke.'
};
</script>

<script setup lang="ts">
import { Button, Card } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Basic">
        <Card title="Simple card" style="width: 22rem">
            <p style="margin: 0">Cards group related content and actions. They have no role of their own; put a heading in the title slot when the card belongs in the page outline.</p>
        </Card>
    </DemoSection>
    <DemoSection title="Header, subtitle and footer">
        <Card title="Advanced card" subtitle="With a banner and actions" style="width: 22rem">
            <template #header>
                <div style="height: 7rem; background: linear-gradient(135deg, var(--vt-primary-color), var(--vt-chart-2))" />
            </template>
            <p style="margin: 0">The header runs edge to edge and follows the card's corners. The footer lines its actions up at the bottom.</p>
            <template #footer>
                <Button label="Save" />
                <Button label="Cancel" severity="secondary" />
            </template>
        </Card>
    </DemoSection>
</template>
