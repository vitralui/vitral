<script setup lang="ts">
import { InputNumber, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const price = ref<number | null>(1299.9);
const dollars = ref<number | null>(49.99);
const opacity = ref<number | null>(0.8);
const distance = ref<number | null>(12.5);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-brl">Preço (pt-BR)</Label>
            <InputNumber id="in-brl" v-model="price" mode="currency" currency="BRL" locale="pt-BR" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ price ?? 'null' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-usd">Price (en-US)</Label>
            <InputNumber id="in-usd" v-model="dollars" mode="currency" currency="USD" locale="en-US" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ dollars ?? 'null' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-opacity">Opacity</Label>
            <InputNumber id="in-opacity" v-model="opacity" mode="percent" :min="0" :max="1" :step="0.05" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ opacity ?? 'null' }}</small>
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-distance">Distance</Label>
            <InputNumber id="in-distance" v-model="distance" suffix=" km" :min-fraction-digits="1" :max-fraction-digits="1" :step="0.5" />
            <small style="color: var(--vt-text-muted-color)">Value: {{ distance ?? 'null' }}</small>
        </StackPanel>
    </StackPanel>
</template>
