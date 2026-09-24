<script setup lang="ts">
import { Listbox } from '@vitral/vue';

const cities = [
    { name: 'São Paulo', code: 'SAO' },
    { name: 'Rio de Janeiro', code: 'RIO' },
    { name: 'Lisboa', code: 'LIS' },
    { name: 'Porto', code: 'OPO' }
];
</script>

<template>
    <Listbox :options="cities" option-label="name" invalid aria-label="Invalid" />
    <Listbox :model-value="cities[2]" :options="cities" option-label="name" disabled aria-label="Disabled" />
</template>
