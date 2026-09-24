<script setup lang="ts">
import { RadioButton, RadioGroup, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const size = ref<string | null>(null);
</script>

<template>
    <StackPanel spacing="1rem">
        <small id="rb-size" style="color: var(--vt-text-muted-color)">Size (required)</small>
        <RadioGroup v-model="size" orientation="horizontal" aria-labelledby="rb-size" :invalid="size === null">
            <RadioButton value="s" label="Small" size="small" />
            <RadioButton value="m" label="Medium" />
            <RadioButton value="l" label="Large" size="large" />
        </RadioGroup>
    </StackPanel>
</template>
