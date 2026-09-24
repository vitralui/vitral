<script setup lang="ts">
import { ProgressBar, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel spacing="0.375rem" style="width: 24rem">
        <span id="pb-connect">Connecting…</span>
        <ProgressBar mode="indeterminate" aria-labelledby="pb-connect" />
    </StackPanel>
</template>
