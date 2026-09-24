<script setup lang="ts">
import { IconField, InputIcon, InputNumber, InputPassword } from '@vitral/vue';
import { ref } from 'vue';

const amount = ref<number | null>(120);
</script>

<template>
    <IconField>
        <InputIcon icon="calendar" />
        <InputNumber v-model="amount" aria-label="Days" />
    </IconField>
    <IconField>
        <InputIcon icon="spinner" spin />
        <InputPassword aria-label="Password" :feedback="false" />
    </IconField>
</template>
