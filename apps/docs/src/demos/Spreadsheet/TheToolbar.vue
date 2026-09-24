<script setup lang="ts">
import { Spreadsheet, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const budget = ref<Record<string, string | number | boolean | null>>({
    A1: 'Month',
    B1: 'Budget',
    C1: 'Spent',
    D1: 'Left',
    E1: 'Used',
    A2: 'January',
    B2: 4000,
    C2: 3120,
    D2: '=B2-C2',
    E2: '=C2/B2',
    A3: 'February',
    B3: 4000,
    C3: 4310,
    D3: '=B3-C3',
    E3: '=C3/B3',
    A4: 'March',
    B4: 4500,
    C4: 3980,
    D4: '=B4-C4',
    E4: '=C4/B4'
});

const minimal = ref<Record<string, string | number | boolean | null>>({
    A1: 'Left',
    B1: 'Centre',
    C1: 'Right',
    A2: 'Pick a cell and press a tool.'
});
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Spreadsheet v-model="budget" :rows="10" :columns="5" aria-label="Toolbar example" style="height: 14rem; width: 100%" />
        <Spreadsheet
            v-model="minimal"
            :toolbar="[['bold', 'italic'], ['alignLeft', 'alignCenter', 'alignRight']]"
            :formula-bar="false"
            :rows="6"
            :columns="4"
            aria-label="Fewer tools"
            style="height: 10rem; width: 100%"
        />
    </StackPanel>
</template>
