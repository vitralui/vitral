<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Popover',
    category: 'Overlay',
    description:
        'A non-modal dialog anchored to what opened it, through `toggle(event)`, `show(event, target?)` and `hide()`. Focus moves in on opening; Escape, a press outside or tabbing past either end closes it and focus goes back to the trigger.'
};
</script>

<script setup lang="ts">
import { Button, InputText, Popover } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const share = ref<InstanceType<typeof Popover> | null>(null);
const members = ref<InstanceType<typeof Popover> | null>(null);
const copied = ref(false);
const link = 'https://vitral.dev/s/7f3a9c';
const people = [
    { name: 'Ana Souza', role: 'Owner' },
    { name: 'Bruno Lima', role: 'Editor' },
    { name: 'Carla Dias', role: 'Viewer' }
];

function copy() {
    navigator.clipboard?.writeText(link).catch(() => {});
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
    <DemoSection title="Share" description="A flyout with a field and a button in it.">
        <Button
            label="Share"
            icon="externalLink"
            aria-haspopup="dialog"
            :aria-expanded="share?.visible ? 'true' : 'false'"
            :aria-controls="share?.visible ? share?.id : undefined"
            @click="share?.toggle($event)"
        />
        <Popover ref="share" aria-labelledby="share-title">
            <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 20rem">
                <strong id="share-title">Share this document</strong>
                <div style="display: flex; gap: 0.5rem">
                    <InputText :model-value="link" readonly aria-label="Link" fluid />
                    <Button :label="copied ? 'Copied' : 'Copy'" :icon="copied ? 'check' : 'copy'" severity="secondary" @click="copy" />
                </div>
                <span class="demo-hint">Anyone with the link can view.</span>
            </div>
        </Popover>
    </DemoSection>

    <DemoSection title="Placement" description="`placement` picks the side; it flips when there is no room.">
        <Button
            label="Team members"
            icon="user"
            severity="secondary"
            aria-haspopup="dialog"
            :aria-expanded="members?.visible ? 'true' : 'false'"
            @click="members?.toggle($event)"
        />
        <Popover ref="members" placement="right-start" aria-label="Team members">
            <ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; min-width: 14rem">
                <li v-for="p in people" :key="p.name" style="display: flex; justify-content: space-between; gap: 1rem">
                    <span>{{ p.name }}</span>
                    <span class="demo-hint">{{ p.role }}</span>
                </li>
            </ul>
            <Button label="Manage" variant="link" size="small" style="margin-top: 0.5rem" @click="members?.hide()" />
        </Popover>
    </DemoSection>
</template>
