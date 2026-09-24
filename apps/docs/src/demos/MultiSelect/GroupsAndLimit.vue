<script setup lang="ts">
import { Label, MultiSelect, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const groups = [
    { label: 'Brazil', items: [{ name: 'São Paulo' }, { name: 'Recife' }] },
    { label: 'Portugal', items: [{ name: 'Lisboa' }, { name: 'Porto' }] },
    { label: 'Angola', items: [{ name: 'Luanda' }] }
];

const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Brasília', code: 'BSB' },
    { name: 'Curitiba', code: 'CWB' },
    { name: 'Recife', code: 'REC' }
];

const grouped = ref<unknown[]>([]);
const limited = ref<string[]>([]);
</script>

<template>
    <StackPanel orientation="horizontal" spacing="0.75rem" align="start" wrap>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="ms-grouped">Cities by country</Label>
            <MultiSelect id="ms-grouped" v-model="grouped" :options="groups" option-group-label="label" option-label="name" placeholder="Pick cities" />
        </StackPanel>
        <StackPanel spacing="0.375rem" style="min-width: 16rem">
            <Label for="ms-limit">Up to two cities</Label>
            <MultiSelect id="ms-limit" v-model="limited" :options="cities" option-label="name" option-value="code" :selection-limit="2" placeholder="Pick two" />
        </StackPanel>
    </StackPanel>
</template>
