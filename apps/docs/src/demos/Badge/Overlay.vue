<script setup lang="ts">
import { Button, OverlayBadge } from '@vitral/vue';
</script>

<template>
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
