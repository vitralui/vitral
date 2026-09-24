<script setup lang="ts">
import { ProgressBar, StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="width: 24rem">
            <span id="pb-files">Copying files</span>
            <ProgressBar :value="64" unit=" of 100 files" aria-labelledby="pb-files" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="width: 24rem">
            <span id="pb-quiet">No label</span>
            <ProgressBar :value="80" :show-value="false" aria-labelledby="pb-quiet" />
        </StackPanel>
    </StackPanel>
</template>
