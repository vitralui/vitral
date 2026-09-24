<script setup lang="ts">
import { CascadeSelect, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const countries = [
    {
        name: 'Brazil',
        states: [
            { name: 'São Paulo', cities: [{ cname: 'São Paulo', code: 'SAO' }, { cname: 'Campinas', code: 'CPQ' }, { cname: 'Santos', code: 'SSZ' }] },
            { name: 'Bahia', cities: [{ cname: 'Salvador', code: 'SSA' }, { cname: 'Porto Seguro', code: 'BPS' }] },
            { name: 'Pernambuco', cities: [{ cname: 'Recife', code: 'REC' }, { cname: 'Olinda', code: 'OLI', disabled: true }] }
        ]
    },
    {
        name: 'Portugal',
        states: [
            { name: 'Lisboa', cities: [{ cname: 'Lisboa', code: 'LIS' }, { cname: 'Sintra', code: 'SNT' }] },
            { name: 'Porto', cities: [{ cname: 'Porto', code: 'OPO' }, { cname: 'Matosinhos', code: 'MAT' }] }
        ]
    },
    { name: 'Angola', states: [{ name: 'Luanda', cities: [{ cname: 'Luanda', code: 'LAD' }] }] }
];

const city = ref<string | null>(null);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="cs-city">City</Label>
        <CascadeSelect
            id="cs-city"
            v-model="city"
            :options="countries"
            option-label="cname"
            option-value="code"
            option-disabled="disabled"
            option-group-label="name"
            :option-group-children="['states', 'cities']"
            placeholder="Select a city"
            show-clear
        />
        <small style="color: var(--vt-text-muted-color)">Value: {{ city ?? 'null' }}</small>
    </StackPanel>
</template>
