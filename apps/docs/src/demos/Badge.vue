<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Badge',
    category: 'Misc',
    description:
        'A count or a status dot. `OverlayBadge` pins one to the corner of what it wraps; the corner badge is hidden from assistive technology and its text repeated where the control can point `aria-describedby` at it.'
};
</script>

<script setup lang="ts">
import { Badge, Button, OverlayBadge } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'help', 'contrast'] as const;
</script>

<template>
    <DemoSection title="Severities">
        <Badge v-for="(s, i) in severities" :key="s" :value="i + 1" :severity="s" />
    </DemoSection>
    <DemoSection title="Sizes and dot" description="Without a value the badge is a dot.">
        <Badge value="8" size="small" />
        <Badge value="8" />
        <Badge value="8" size="large" />
        <Badge value="8" size="xlarge" />
        <Badge value="99+" severity="danger" />
        <Badge severity="success" />
        <Badge severity="danger" />
    </DemoSection>
    <DemoSection title="OverlayBadge" description="Bind the slot’s `badgeId` as aria-describedby: “Notifications, 4”.">
        <OverlayBadge value="4" severity="danger">
            <template #default="{ badgeId }">
                <Button icon="bell" severity="secondary" aria-label="Notifications" :aria-describedby="badgeId" />
            </template>
        </OverlayBadge>
        <OverlayBadge value="12">
            <template #default="{ badgeId }">
                <Button icon="menu" severity="secondary" variant="outlined" aria-label="Inbox" :aria-describedby="badgeId" />
            </template>
        </OverlayBadge>
        <OverlayBadge severity="success">
            <span class="demo-avatar" role="img" aria-label="Ana Souza, online">AS</span>
        </OverlayBadge>
    </DemoSection>
</template>

<style scoped>
.demo-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    font-weight: 600;
    color: var(--vt-primary-contrast-color);
    background: var(--vt-primary-color);
}
</style>
