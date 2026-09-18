<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SpeedDial',
    category: 'Button',
    description:
        'A floating button that fans its actions out, in a line or around a circle. It is a menu button: opening from the keyboard focuses the first action, the arrows move between them, Escape and Tab close. Each action is named by its label, which also shows as a tooltip.'
};
</script>

<script setup lang="ts">
import { SpeedDial, type MenuItem } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const last = ref('—');
const actions: MenuItem[] = [
    { label: 'Add', icon: 'plus', command: () => (last.value = 'Add') },
    { label: 'Edit', icon: 'pencil', command: () => (last.value = 'Edit') },
    { label: 'Copy', icon: 'copy', command: () => (last.value = 'Copy') },
    { label: 'Delete', icon: 'trash', command: () => (last.value = 'Delete') }
];
</script>

<template>
    <DemoSection title="Linear">
        <div style="display: flex; gap: 6rem; align-items: center; padding: 11rem 8rem 1rem">
            <SpeedDial :model="actions" direction="up" aria-label="Actions (up)" />
            <SpeedDial :model="actions" direction="right" aria-label="Actions (right)" severity="secondary" />
        </div>
        <span class="demo-hint">Last action: {{ last }}</span>
    </DemoSection>
    <DemoSection title="Circle and semi-circle">
        <div style="display: flex; gap: 12rem; align-items: center; padding: 6rem 7rem">
            <SpeedDial :model="actions" type="circle" :radius="80" aria-label="Actions (circle)" severity="help" />
            <SpeedDial :model="actions" type="semi-circle" direction="up" :radius="90" hide-icon="x" aria-label="Actions (semi-circle)" severity="success" />
        </div>
    </DemoSection>
    <DemoSection title="Quarter circle">
        <div style="display: flex; justify-content: flex-end; width: 100%; padding: 7rem 1rem 1rem">
            <SpeedDial :model="actions" type="quarter-circle" direction="up-left" :radius="110" aria-label="Actions (quarter)" severity="contrast" />
        </div>
    </DemoSection>
</template>
