<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ProgressBar',
    category: 'Messages',
    description: 'How far along a task is, as a thin bar. A WAI-ARIA progressbar with its value and range, or none at all while indeterminate; name it with `aria-labelledby` or `aria-label`.'
};
</script>

<script setup lang="ts">
import { Button, ProgressBar } from '@vitral/vue';
import { onBeforeUnmount, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const value = ref(35);
let timer: ReturnType<typeof setInterval> | undefined;

function run() {
    clearInterval(timer);
    value.value = 0;
    timer = setInterval(() => {
        value.value = Math.min(100, value.value + Math.round(Math.random() * 12));
        if (value.value >= 100) clearInterval(timer);
    }, 300);
}

onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
    <DemoSection title="Determinate">
        <div class="demo-field" style="width: 24rem">
            <span id="pb-upload">Uploading photos</span>
            <ProgressBar :value="value" aria-labelledby="pb-upload" />
        </div>
        <Button label="Run" icon="refresh" severity="secondary" size="small" @click="run" />
    </DemoSection>
    <DemoSection title="Label" description="`unit` follows the value and becomes its spoken text; `show-value` off hides it; the slot replaces it.">
        <div class="demo-field" style="width: 24rem">
            <span id="pb-files">Copying files</span>
            <ProgressBar :value="64" unit=" of 100 files" aria-labelledby="pb-files" />
        </div>
        <div class="demo-field" style="width: 24rem">
            <span id="pb-quiet">No label</span>
            <ProgressBar :value="80" :show-value="false" aria-labelledby="pb-quiet" />
        </div>
    </DemoSection>
    <DemoSection title="Indeterminate" description="Work of unknown length; no value is announced.">
        <div class="demo-field" style="width: 24rem">
            <span id="pb-connect">Connecting…</span>
            <ProgressBar mode="indeterminate" aria-labelledby="pb-connect" />
        </div>
    </DemoSection>
</template>
