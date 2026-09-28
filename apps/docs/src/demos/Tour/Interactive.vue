<script setup lang="ts">
import { settings as settingsIcon } from '@vitral/icons';
import { Button, Checkbox, Tour, type TourStep } from '@vitral/vue';
import { ref } from 'vue';

const open = ref(false);
const loaded = ref(false);
const admin = ref(false);
const load = ref<{ $el: HTMLElement } | null>(null);
const report = ref<HTMLElement | null>(null);
const settings = ref<{ $el: HTMLElement } | null>(null);

const steps: TourStep[] = [
    {
        element: () => load.value,
        popover: { title: 'Load a report', description: 'Press the button — the tour moves on when you do.', showButtons: ['close'] },
        advanceOn: { event: 'click' }
    },
    {
        // Not on the page until the report has loaded: the step waits for it.
        element: () => report.value,
        waitFor: 3000,
        popover: { title: 'Your report', description: 'It arrived a moment after the press, and this step waited for it.' }
    },
    {
        // Only for someone who can change the settings.
        when: () => admin.value,
        element: () => settings.value,
        popover: { title: 'Settings', description: 'Shown only because “I am an admin” is ticked.' }
    },
    { popover: { title: 'Done', description: 'Steps that do not apply were left out of the count too.' } }
];

function start() {
    loaded.value = false;
    open.value = true;
}

function loadReport() {
    setTimeout(() => (loaded.value = true), 400);
}
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: center">
            <Button label="Start" icon="play" @click="start" />
            <label style="display: inline-flex; gap: 0.5rem; align-items: center"><Checkbox v-model="admin" binary /> I am an admin</label>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <Button ref="load" label="Load report" icon="download" variant="outlined" @click="loadReport" />
            <Button ref="settings" label="Settings" :icon="settingsIcon" variant="text" severity="secondary" />
        </div>
        <div v-if="loaded" ref="report" style="padding: 1rem; border: 1px solid var(--vt-content-border-color); border-radius: 0.5rem">Q3 report: revenue up 12%.</div>
        <Tour v-model:open="open" :steps="steps" show-progress />
    </div>
</template>
