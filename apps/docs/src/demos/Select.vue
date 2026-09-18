<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Select',
    category: 'Form',
    description:
        'Choose one option from a list. It is the WAI-ARIA select-only combobox: arrows, Home/End, typeahead, Enter/Space, Alt+Up/Down, Escape. Add `filter` and it becomes a searchable combobox; search ignores case and accents.'
};
</script>

<script setup lang="ts">
import { Select } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const cities = [
    { name: 'São Paulo', code: 'SP' },
    { name: 'Rio de Janeiro', code: 'RJ' },
    { name: 'Belo Horizonte', code: 'BH' },
    { name: 'Brasília', code: 'BSB' },
    { name: 'Curitiba', code: 'CWB' },
    { name: 'Florianópolis', code: 'FLN', disabled: true },
    { name: 'Porto Alegre', code: 'POA' },
    { name: 'Recife', code: 'REC' },
    { name: 'Salvador', code: 'SSA' },
    { name: 'Manaus', code: 'MAO' }
];

const groups = [
    { label: 'Brazil', items: [{ name: 'São Paulo' }, { name: 'Recife' }] },
    { label: 'Portugal', items: [{ name: 'Lisboa' }, { name: 'Porto' }] },
    { label: 'Angola', items: [{ name: 'Luanda' }] }
];

const city = ref<string | null>(null);
const searched = ref<string | null>('REC');
const grouped = ref<unknown>(null);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="sel-city">City</label>
            <Select id="sel-city" v-model="city" :options="cities" option-label="name" option-value="code" option-disabled="disabled" placeholder="Select a city" show-clear checkmark />
            <span class="demo-hint">Value: {{ city ?? 'null' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Filter">
        <div class="demo-field">
            <label for="sel-search">City (searchable)</label>
            <Select id="sel-search" v-model="searched" :options="cities" option-label="name" option-value="code" filter placeholder="Search…" />
        </div>
    </DemoSection>
    <DemoSection title="Groups">
        <div class="demo-field">
            <label for="sel-group">City by country</label>
            <Select id="sel-group" v-model="grouped" :options="groups" option-group-label="label" option-label="name" placeholder="Pick a city" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <Select :options="cities" option-label="name" placeholder="Small" size="small" aria-label="Small" />
        <Select :options="cities" option-label="name" placeholder="Filled" variant="filled" aria-label="Filled" />
        <Select :options="cities" option-label="name" placeholder="Invalid" invalid aria-label="Invalid" />
        <Select :options="cities" option-label="name" placeholder="Loading" loading aria-label="Loading" />
        <Select :options="cities" option-label="name" placeholder="Disabled" disabled aria-label="Disabled" />
    </DemoSection>
</template>
