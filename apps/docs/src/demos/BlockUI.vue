<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'BlockUI',
    category: 'Messages',
    description:
        'A veil over a region while it is busy. The region becomes `inert` and `aria-busy`, and the veil carries a status saying why. `full-screen` veils the whole page, holding focus and scroll until it lifts.'
};
</script>

<script setup lang="ts">
import { BlockUI, Button, InputText, ProgressSpinner } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const blocked = ref(false);
const page = ref(false);

function blockPage() {
    page.value = true;
    setTimeout(() => (page.value = false), 2000);
}
</script>

<template>
    <DemoSection title="A region" class="stack">
        <Button :label="blocked ? 'Unblock' : 'Block'" style="align-self: flex-start" @click="blocked = !blocked" />
        <BlockUI :blocked="blocked" label="Saving the form">
            <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border: 1px solid var(--vt-content-border-color); border-radius: 8px">
                <label for="block-name">Name</label>
                <InputText id="block-name" />
                <Button label="Save" style="align-self: flex-start" />
            </div>
            <template #mask><ProgressSpinner aria-hidden="true" /></template>
        </BlockUI>
    </DemoSection>
    <DemoSection title="The whole page">
        <Button label="Block for two seconds" @click="blockPage" />
        <BlockUI :blocked="page" full-screen label="Please wait">
            <template #mask><ProgressSpinner aria-hidden="true" /></template>
        </BlockUI>
    </DemoSection>
</template>
