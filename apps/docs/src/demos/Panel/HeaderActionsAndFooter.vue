<script setup lang="ts">
import { Button, Panel } from '@vitral/vue';
</script>

<template>
    <Panel header="Storage" toggleable style="width: 100%">
        <template #icons>
            <Button icon="refresh" variant="text" severity="secondary" size="small" aria-label="Refresh" />
            <Button icon="moreHorizontal" variant="text" severity="secondary" size="small" aria-label="More options" />
        </template>
        <p style="margin: 0">42 GB of 128 GB used. The actions sit outside the toggle button, so each one is its own tab stop.</p>
        <template #footer>
            <small style="color: var(--vt-text-muted-color)">Last synced a minute ago</small>
        </template>
    </Panel>
</template>
