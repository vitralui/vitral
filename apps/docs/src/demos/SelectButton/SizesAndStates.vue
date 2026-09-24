<script setup lang="ts">
import { SelectButton } from '@vitral/vue';
import { ref } from 'vue';

const plan = ref('pro');
const plans = [
    { name: 'Free', code: 'free' },
    { name: 'Pro', code: 'pro' },
    { name: 'Enterprise', code: 'ent', off: true }
];
</script>

<template>
    <SelectButton v-model="plan" :options="plans" option-label="name" option-value="code" option-disabled="off" size="small" label="Plan (small)" />
    <SelectButton v-model="plan" :options="plans" option-label="name" option-value="code" option-disabled="off" size="large" label="Plan (large)" />
    <SelectButton :model-value="'pro'" :options="plans" option-label="name" option-value="code" disabled label="Plan (disabled)" />
</template>
