<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Panel',
    category: 'Panel',
    description:
        "A titled container. With `toggleable` it becomes an expander: the header is a button with aria-expanded that shows and hides a labelled region, animated unless the system asks for reduced motion."
};
</script>

<script setup lang="ts">
import { Button, Panel } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const collapsed = ref(false);
</script>

<template>
    <DemoSection title="Basic">
        <Panel header="Header" style="width: 100%">
            <p style="margin: 0">A panel groups content under a header. Without `toggleable` the header is plain text.</p>
        </Panel>
    </DemoSection>
    <DemoSection title="Toggleable (Expander)" class="stack">
        <Panel v-model:collapsed="collapsed" header="Advanced settings" toggleable style="width: 100%">
            <p style="margin: 0">Press the header, or Tab to it and press Enter or Space, to collapse this content.</p>
        </Panel>
        <span class="demo-hint">collapsed: {{ collapsed }}</span>
    </DemoSection>
    <DemoSection title="Header actions and footer">
        <Panel header="Storage" toggleable style="width: 100%">
            <template #icons>
                <Button icon="refresh" variant="text" severity="secondary" size="small" aria-label="Refresh" />
                <Button icon="moreHorizontal" variant="text" severity="secondary" size="small" aria-label="More options" />
            </template>
            <p style="margin: 0">42 GB of 128 GB used. The actions sit outside the toggle button, so each one is its own tab stop.</p>
            <template #footer>
                <span class="demo-hint">Last synced a minute ago</span>
            </template>
        </Panel>
    </DemoSection>
    <DemoSection title="Custom toggle icon, starting collapsed">
        <Panel header="Details" toggleable :collapsed="true" toggle-icon="plus" style="width: 100%">
            <p style="margin: 0">A custom icon replaces the chevron and does not turn over.</p>
        </Panel>
    </DemoSection>
</template>
