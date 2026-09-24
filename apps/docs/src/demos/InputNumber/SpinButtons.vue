<script setup lang="ts">
import { InputNumber, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const rating = ref<number | null>(4);
const width = ref<number | null>(320);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-rating">Rating (stacked)</Label>
            <InputNumber id="in-rating" v-model="rating" show-buttons :min="1" :max="5" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="in-width">Width (horizontal)</Label>
            <InputNumber id="in-width" v-model="width" show-buttons button-layout="horizontal" :step="10" :min="0" suffix=" px" />
        </StackPanel>
    </StackPanel>
</template>
