<script setup lang="ts">
import { CascadeSelect } from '@vitral/vue';

const menu = [
    { label: 'Coffee', items: [{ label: 'Espresso' }, { label: 'Filter' }] },
    { label: 'Tea', items: [{ label: 'Green', items: [{ label: 'Sencha' }, { label: 'Matcha' }] }, { label: 'Black' }] },
    { label: 'Water' }
];
</script>

<template>
    <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Small" size="small" aria-label="Small" />
    <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Filled" variant="filled" aria-label="Filled" />
    <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Invalid" invalid aria-label="Invalid" />
    <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Disabled" disabled aria-label="Disabled" />
</template>
