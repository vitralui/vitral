<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MultiSelect',
    category: 'Form',
    description:
        'Select, with several choices. The combobox opens a multi-selectable listbox: Enter and Space toggle the active option and keep the list open, Ctrl+A toggles them all (so does the header box), Tab and Escape close. The choice shows as a list, a count past `max-selected-labels`, or chips.'
};
</script>

<script setup lang="ts">
import { MultiSelect } from '@vitral/vue';
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
    { name: 'Salvador', code: 'SSA' }
];

const groups = [
    { label: 'Brazil', items: [{ name: 'São Paulo' }, { name: 'Recife' }] },
    { label: 'Portugal', items: [{ name: 'Lisboa' }, { name: 'Porto' }] },
    { label: 'Angola', items: [{ name: 'Luanda' }] }
];

const basic = ref<string[]>(['SP']);
const chips = ref<string[]>(['RJ', 'CWB']);
const grouped = ref<unknown[]>([]);
const limited = ref<string[]>([]);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="ms-basic">Cities</label>
            <MultiSelect id="ms-basic" v-model="basic" :options="cities" option-label="name" option-value="code" option-disabled="disabled" placeholder="Select cities" :max-selected-labels="3" show-clear />
            <span class="demo-hint">Value: {{ basic.join(', ') || '[]' }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Chips and filter">
        <div class="demo-field" style="min-width: 22rem">
            <label for="ms-chips">Cities</label>
            <MultiSelect id="ms-chips" v-model="chips" :options="cities" option-label="name" option-value="code" display="chip" filter fluid placeholder="Select cities" />
        </div>
    </DemoSection>
    <DemoSection title="Groups and a selection limit">
        <div class="demo-field">
            <label for="ms-grouped">Cities by country</label>
            <MultiSelect id="ms-grouped" v-model="grouped" :options="groups" option-group-label="label" option-label="name" placeholder="Pick cities" />
        </div>
        <div class="demo-field">
            <label for="ms-limit">Up to two cities</label>
            <MultiSelect id="ms-limit" v-model="limited" :options="cities" option-label="name" option-value="code" :selection-limit="2" placeholder="Pick two" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <MultiSelect :options="cities" option-label="name" placeholder="Small" size="small" aria-label="Small" />
        <MultiSelect :options="cities" option-label="name" placeholder="Filled" variant="filled" aria-label="Filled" />
        <MultiSelect :options="cities" option-label="name" placeholder="Invalid" invalid aria-label="Invalid" />
        <MultiSelect :options="cities" option-label="name" placeholder="Loading" loading aria-label="Loading" />
        <MultiSelect :options="cities" option-label="name" placeholder="Disabled" disabled aria-label="Disabled" />
    </DemoSection>
</template>
