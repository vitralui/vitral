<script setup lang="ts">
import { Button, InputText, Popover } from '@vitral/vue';
import { ref } from 'vue';

const share = ref<InstanceType<typeof Popover> | null>(null);
const copied = ref(false);
const link = 'https://vitral.dev/s/7f3a9c';

function copy() {
    navigator.clipboard?.writeText(link).catch(() => {});
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
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
            <small style="color: var(--vt-text-muted-color)">Anyone with the link can view.</small>
        </div>
    </Popover>
</template>
