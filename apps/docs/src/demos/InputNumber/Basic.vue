<script setup lang="ts">
import { InputNumber, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const quantity = ref<number | null>(3);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="in-qty">Quantity</Label>
        <InputNumber id="in-qty" v-model="quantity" :min="0" :max="99" placeholder="0" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ quantity ?? 'null' }}</small>
    </StackPanel>
</template>
