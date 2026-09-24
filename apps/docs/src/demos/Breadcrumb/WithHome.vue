<script setup lang="ts">
import { Breadcrumb, type BreadcrumbItem } from '@vitral/vue';

const home: BreadcrumbItem = { url: '#' };
const trail: BreadcrumbItem[] = [
    { label: 'Electronics', url: '#' },
    { label: 'Computers', url: '#' },
    { label: 'Laptops', url: '#' },
    { label: 'Vitral 14' }
];
</script>

<template>
    <Breadcrumb :home="home" :model="trail" />
</template>
