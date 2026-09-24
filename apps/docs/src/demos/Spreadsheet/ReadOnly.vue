<script setup lang="ts">
import { Spreadsheet } from '@vitral/vue';
import { ref } from 'vue';

const terms = ref<Record<string, string | number | boolean | null>>({
    A1: 'Plan',
    B1: 'Seats',
    C1: 'Monthly',
    A2: 'Team',
    B2: 12,
    C2: '=B2*9',
    A3: 'Business',
    B3: 40,
    C3: '=B3*7'
});
</script>

<template>
    <Spreadsheet v-model="terms" readonly :formula-bar="false" :rows="6" :columns="4" aria-label="Terms" style="height: 10rem; width: 100%" />
</template>
