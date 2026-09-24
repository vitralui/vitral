<script setup lang="ts">
import { RadioButton, RadioGroup, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const delivery = ref('standard');
</script>

<template>
    <StackPanel spacing="1rem">
        <small id="rb-delivery" style="color: var(--vt-text-muted-color)">Delivery</small>
        <RadioGroup v-model="delivery" aria-labelledby="rb-delivery">
            <RadioButton value="standard" label="Standard (5–7 days)" />
            <RadioButton value="express" label="Express (2 days)" />
            <RadioButton value="pickup" label="Pick up in store" />
            <RadioButton value="drone" label="Drone" disabled />
        </RadioGroup>
        <small style="color: var(--vt-text-muted-color)">Value: {{ delivery }}</small>
    </StackPanel>
</template>
