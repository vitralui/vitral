<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Drawer',
    category: 'Overlay',
    description: 'A panel that slides in from an edge of the viewport, or covers it. Same modal dialog behaviour as Dialog: focus in, Tab trapped, Escape and a press on the mask close, focus returns.'
};
</script>

<script setup lang="ts">
import { Button, Drawer } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

type Position = 'left' | 'right' | 'top' | 'bottom' | 'full';

const visible = ref(false);
const position = ref<Position>('left');
const positions: Position[] = ['left', 'right', 'top', 'bottom', 'full'];
const links = ['Inbox', 'Drafts', 'Sent', 'Archive', 'Trash'];

function open(where: Position) {
    position.value = where;
    visible.value = true;
}
</script>

<template>
    <DemoSection title="Positions">
        <Button v-for="p in positions" :key="p" :label="p" severity="secondary" :icon="p === 'full' ? 'maximize' : 'sidebar'" @click="open(p)" />
        <Drawer v-model:visible="visible" header="Mail" :position="position">
            <nav aria-label="Folders" style="display: flex; flex-direction: column; gap: 2px">
                <a v-for="link in links" :key="link" href="#/drawer" class="demo-drawer-link" @click.prevent="visible = false">{{ link }}</a>
            </nav>
            <template #footer>
                <Button label="Compose" icon="pencil" fluid @click="visible = false" />
            </template>
        </Drawer>
    </DemoSection>
</template>

<style scoped>
.demo-drawer-link {
    padding: var(--vt-navigation-item-padding);
    border-radius: var(--vt-navigation-item-border-radius);
    color: var(--vt-navigation-item-color);
    text-decoration: none;
}

.demo-drawer-link:hover {
    background: var(--vt-navigation-item-focus-background);
}

.demo-drawer-link:focus-visible {
    outline: var(--vt-focus-ring-width) var(--vt-focus-ring-style) var(--vt-focus-ring-color);
    outline-offset: -2px;
}
</style>
