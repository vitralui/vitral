<script setup lang="ts">
import { Label, MultiSelect, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Belo Horizonte', code: 'BH' },
    { name: 'Brasília', code: 'BSB' },
    { name: 'Curitiba', code: 'CWB' },
    { name: 'Florianópolis', code: 'FLN', disabled: true },
    { name: 'Porto Alegre', code: 'POA' },
    { name: 'Recife', code: 'REC' },
    { name: 'Salvador', code: 'SSA' }
];

const selected = ref<string[]>(['SP']);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ms-basic">Cities</Label>
        <MultiSelect id="ms-basic" v-model="selected" :options="cities" option-label="name" option-value="code" option-disabled="disabled" placeholder="Select cities" :max-selected-labels="3" show-clear />
        <small style="color: var(--vt-text-muted-color)">Value: {{ selected.join(', ') || '[]' }}</small>
    </StackPanel>
</template>
