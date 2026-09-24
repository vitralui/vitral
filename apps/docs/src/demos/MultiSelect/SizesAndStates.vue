<script setup lang="ts">
import { MultiSelect } from '@vitral/vue';

const cities = [{ name: 'São Paulo' }, { name: 'Rio de Janeiro' }, { name: 'Brasília' }, { name: 'Curitiba' }, { name: 'Recife' }];
</script>

<template>
    <MultiSelect :options="cities" option-label="name" placeholder="Small" size="small" aria-label="Small" />
    <MultiSelect :options="cities" option-label="name" placeholder="Filled" variant="filled" aria-label="Filled" />
    <MultiSelect :options="cities" option-label="name" placeholder="Invalid" invalid aria-label="Invalid" />
    <MultiSelect :options="cities" option-label="name" placeholder="Loading" loading aria-label="Loading" />
    <MultiSelect :options="cities" option-label="name" placeholder="Disabled" disabled aria-label="Disabled" />
</template>
