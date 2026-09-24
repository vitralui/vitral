<script setup lang="ts">
import { Button, ProgressBar, StackPanel } from '@vitral/vue';
import { onBeforeUnmount, ref } from 'vue';

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
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="width: 24rem">
            <span id="pb-upload">Uploading photos</span>
            <ProgressBar :value="value" aria-labelledby="pb-upload" />
        </StackPanel>
        <Button label="Run" icon="refresh" severity="secondary" size="small" @click="run" />
    </StackPanel>
</template>
