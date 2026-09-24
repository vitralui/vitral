<script setup lang="ts">
import { Knob, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const volume = ref(60);
</script>

<template>
    <StackPanel spacing="0.375rem">
        <span id="knob-volume">Volume</span>
        <Knob v-model="volume" aria-labelledby="knob-volume" value-template="{value}%" />
    </StackPanel>
</template>
