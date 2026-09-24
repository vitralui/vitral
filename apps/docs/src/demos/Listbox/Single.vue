<script setup lang="ts">
import { Label, Listbox, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const cities = [
    { name: 'São Paulo', code: 'SAO' },
    { name: 'Rio de Janeiro', code: 'RIO' },
    { name: 'Lisboa', code: 'LIS' },
    { name: 'Porto', code: 'OPO' },
    { name: 'Évora', code: 'EVO', off: true },
    { name: 'Montréal', code: 'YUL' },
    { name: 'Bogotá', code: 'BOG' },
    { name: 'Kraków', code: 'KRK' },
    { name: 'Reykjavík', code: 'REK' },
    { name: 'Zürich', code: 'ZRH' },
    { name: 'Tōkyō', code: 'TYO' },
    { name: 'Málaga', code: 'AGP' }
];
const city = ref<string | null>('LIS');
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label id="lb-city-label">Airport</Label>
        <Listbox v-model="city" :options="cities" option-label="name" option-value="code" option-disabled="off" checkmark aria-labelledby="lb-city-label" scroll-height="14rem" />
        <small style="color: var(--vt-text-muted-color)">Value: {{ city ?? 'null' }}</small>
    </StackPanel>
</template>
