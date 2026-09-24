<script setup lang="ts">
import { Select } from '@vitral/vue';

const cities = [{ name: 'São Paulo' }, { name: 'Rio de Janeiro' }, { name: 'Brasília' }, { name: 'Curitiba' }, { name: 'Recife' }];
</script>

<template>
    <Select :options="cities" option-label="name" placeholder="Small" size="small" aria-label="Small" />
    <Select :options="cities" option-label="name" placeholder="Filled" variant="filled" aria-label="Filled" />
    <Select :options="cities" option-label="name" placeholder="Invalid" invalid aria-label="Invalid" />
    <Select :options="cities" option-label="name" placeholder="Loading" loading aria-label="Loading" />
    <Select :options="cities" option-label="name" placeholder="Disabled" disabled aria-label="Disabled" />
</template>
