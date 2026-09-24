<script setup lang="ts">
import { RadioButton, RadioGroup, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const plans = [
    { id: 'free', name: 'Free', price: 0 },
    { id: 'pro', name: 'Pro', price: 12 },
    { id: 'team', name: 'Team', price: 30 }
];
const plan = ref<(typeof plans)[number] | null>(plans[1]!);
</script>

<template>
    <StackPanel spacing="1rem">
        <small id="rb-plan" style="color: var(--vt-text-muted-color)">Plan</small>
        <RadioGroup v-model="plan" orientation="horizontal" aria-labelledby="rb-plan">
            <RadioButton v-for="p in plans" :key="p.id" :value="p">{{ p.name }} <small style="color: var(--vt-text-muted-color)">${{ p.price }}/mo</small></RadioButton>
        </RadioGroup>
        <small style="color: var(--vt-text-muted-color)">Value: {{ plan }}</small>
    </StackPanel>
</template>
