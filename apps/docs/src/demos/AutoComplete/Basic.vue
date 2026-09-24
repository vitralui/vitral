<script setup lang="ts">
import { AutoComplete, FilterService, Label, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

interface Country {
    name: string;
    code: string;
    region: string;
}

const countries: Country[] = [
    { name: 'Angola', code: 'AO', region: 'Africa' },
    { name: 'Argentina', code: 'AR', region: 'Americas' },
    { name: 'Brazil', code: 'BR', region: 'Americas' },
    { name: 'Cabo Verde', code: 'CV', region: 'Africa' },
    { name: 'Canada', code: 'CA', region: 'Americas' },
    { name: 'Chile', code: 'CL', region: 'Americas' },
    { name: 'Colombia', code: 'CO', region: 'Americas' },
    { name: 'France', code: 'FR', region: 'Europe' },
    { name: 'Germany', code: 'DE', region: 'Europe' },
    { name: 'Moçambique', code: 'MZ', region: 'Africa' },
    { name: 'Peru', code: 'PE', region: 'Americas' },
    { name: 'Portugal', code: 'PT', region: 'Europe' },
    { name: 'Spain', code: 'ES', region: 'Europe' },
    { name: 'São Tomé and Príncipe', code: 'ST', region: 'Africa' },
    { name: 'Uruguay', code: 'UY', region: 'Americas' }
];

const match = (query: string) => countries.filter((c) => FilterService.matches(c.name, query, 'contains'));

const single = ref<Country | string | null>(null);
const suggestions = ref<Country[]>([]);
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ac-country">Country</Label>
        <AutoComplete
            id="ac-country"
            v-model="single"
            :suggestions="suggestions"
            option-label="name"
            placeholder="Type a country"
            @complete="suggestions = match($event.query)"
        />
        <small style="color: var(--vt-text-muted-color)">Value: {{ typeof single === 'string' ? `"${single}"` : (single?.code ?? 'null') }}</small>
    </StackPanel>
</template>
