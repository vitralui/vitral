<script setup lang="ts">
import { CascadeSelect, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const menu = [
    { label: 'Coffee', items: [{ label: 'Espresso' }, { label: 'Filter' }] },
    { label: 'Tea', items: [{ label: 'Green', items: [{ label: 'Sencha' }, { label: 'Matcha' }] }, { label: 'Black' }] },
    { label: 'Water' }
];

const drink = ref<unknown>(null);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="cs-drink">Drink</Label>
        <CascadeSelect id="cs-drink" v-model="drink" :options="menu" option-label="label" option-group-label="label" placeholder="Pick a drink" />
    </StackPanel>
</template>
