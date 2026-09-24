<script setup lang="ts">
import { FloatLabel, Select } from '@vitral/vue';
import { ref } from 'vue';

const city = ref<string | null>(null);
const cities = ['Lisbon', 'Porto', 'São Paulo', 'Rio de Janeiro'];
</script>

<template>
    <FloatLabel :filled="city != null" style="min-width: 14rem">
        <Select v-model="city" :options="cities" id="fl-city" fluid />
        <label for="fl-city">City</label>
    </FloatLabel>
</template>
