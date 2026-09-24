<script setup lang="ts">
import { Label, Select, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Belo Horizonte', code: 'BH' },
    { name: 'Brasília', code: 'BSB' },
    { name: 'Curitiba', code: 'CWB' },
    { name: 'Florianópolis', code: 'FLN' },
    { name: 'Porto Alegre', code: 'POA' },
    { name: 'Recife', code: 'REC' },
    { name: 'Salvador', code: 'SSA' },
    { name: 'Manaus', code: 'MAO' }
];

const city = ref<string | null>('REC');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="sel-search">City (searchable)</Label>
        <Select id="sel-search" v-model="city" :options="cities" option-label="name" option-value="code" filter placeholder="Search…" />
    </StackPanel>
</template>
