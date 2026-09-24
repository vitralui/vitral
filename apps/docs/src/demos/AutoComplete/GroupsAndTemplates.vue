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

const grouped = ref<Country | null>(null);
const groupedSuggestions = ref<{ region: string; items: Country[] }[]>([]);
function searchGrouped(query: string) {
    const hits = match(query);
    groupedSuggestions.value = ['Africa', 'Americas', 'Europe']
        .map((region) => ({ region, items: hits.filter((c) => c.region === region) }))
        .filter((g) => g.items.length);
}
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ac-grouped">Country by region</Label>
        <AutoComplete
            id="ac-grouped"
            v-model="grouped"
            :suggestions="groupedSuggestions"
            option-label="name"
            option-group-label="region"
            auto-option-focus
            @complete="searchGrouped($event.query)"
        >
            <template #option="{ option }">
                <span style="flex: 1">{{ (option as Country).name }}</span>
                <small style="color: var(--vt-text-muted-color)">{{ (option as Country).code }}</small>
            </template>
        </AutoComplete>
    </StackPanel>
</template>
