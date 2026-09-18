<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'CascadeSelect',
    category: 'Form',
    description:
        'Nested options, one column per level. The combobox opens a WAI-ARIA tree: Up and Down move within a column, Right or Enter opens a group, Left and Escape go back a column, Enter chooses. Focus stays on the combobox throughout.'
};
</script>

<script setup lang="ts">
import { CascadeSelect } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
const flat = ref<unknown>(null);
const menu = [
    { label: 'Coffee', items: [{ label: 'Espresso' }, { label: 'Filter' }] },
    { label: 'Tea', items: [{ label: 'Green', items: [{ label: 'Sencha' }, { label: 'Matcha' }] }, { label: 'Black' }] },
    { label: 'Water' }
];
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="cs-city">City</label>
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
            <span class="demo-hint">Value: {{ city ?? 'null' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Uneven depth">
        <div class="demo-field">
            <label for="cs-drink">Drink</label>
            <CascadeSelect id="cs-drink" v-model="flat" :options="menu" option-label="label" option-group-label="label" placeholder="Pick a drink" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Small" size="small" aria-label="Small" />
        <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Filled" variant="filled" aria-label="Filled" />
        <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Invalid" invalid aria-label="Invalid" />
        <CascadeSelect :options="menu" option-label="label" option-group-label="label" placeholder="Disabled" disabled aria-label="Disabled" />
    </DemoSection>
</template>
