<script setup lang="ts">
import { InputGroup, InputGroupAddon, InputNumber } from '@vitral/vue';
import { ref } from 'vue';

const from = ref<number | null>(10);
const to = ref<number | null>(90);
</script>

<template>
    <InputGroup label="Price range" style="max-width: 24rem">
        <InputNumber v-model="from" aria-label="From" />
        <InputGroupAddon>to</InputGroupAddon>
        <InputNumber v-model="to" aria-label="To" />
    </InputGroup>
</template>
