<script setup lang="ts">
import { DescriptionList } from '@vitral/vue';

const items = [
    { label: 'Full name', value: 'Ana Souza' },
    { label: 'Role', value: 'Product designer' },
    { label: 'Email', value: 'ana@example.com' },
    { label: 'Phone', value: null },
    { label: 'About', value: 'Leads the design system and the research behind the checkout.', span: 2 }
];
</script>

<template>
    <DescriptionList title="Profile" :items="items" :columns="2" style="width: 100%" />
</template>
