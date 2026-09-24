<script setup lang="ts">
import { Label, Select, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const groups = [
    { label: 'Brazil', items: [{ name: 'São Paulo' }, { name: 'Recife' }] },
    { label: 'Portugal', items: [{ name: 'Lisboa' }, { name: 'Porto' }] },
    { label: 'Angola', items: [{ name: 'Luanda' }] }
];

const city = ref<unknown>(null);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="sel-group">City by country</Label>
        <Select id="sel-group" v-model="city" :options="groups" option-group-label="label" option-label="name" placeholder="Pick a city" />
    </StackPanel>
</template>
