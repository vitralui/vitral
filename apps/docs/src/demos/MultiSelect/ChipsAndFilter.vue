<script setup lang="ts">
import { Label, MultiSelect, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Belo Horizonte', code: 'BH' },
    { name: 'Brasília', code: 'BSB' },
    { name: 'Curitiba', code: 'CWB' },
    { name: 'Porto Alegre', code: 'POA' },
    { name: 'Recife', code: 'REC' },
    { name: 'Salvador', code: 'SSA' }
];

const selected = ref<string[]>(['RJ', 'CWB']);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 22rem">
        <Label for="ms-chips">Cities</Label>
        <MultiSelect id="ms-chips" v-model="selected" :options="cities" option-label="name" option-value="code" display="chip" filter fluid placeholder="Select cities" />
    </StackPanel>
</template>
