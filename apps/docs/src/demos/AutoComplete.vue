<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'AutoComplete',
    category: 'Form',
    description:
        'The WAI-ARIA editable combobox with list autocomplete. Typing asks the app for suggestions through `complete`; Down and Up move through them, Enter takes one, Escape closes the list and then clears the box, and the number of results is announced. With `multiple` the values become chips; with `dropdown` a button asks for the whole list.'
};
</script>

<script setup lang="ts">
import { AutoComplete, FilterService } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
const singleSuggestions = ref<Country[]>([]);

const many = ref<Country[]>([]);
const manySuggestions = ref<Country[]>([]);

const grouped = ref<Country | null>(null);
const groupedSuggestions = ref<{ region: string; items: Country[] }[]>([]);
function searchGrouped(query: string) {
    const hits = match(query);
    groupedSuggestions.value = ['Africa', 'Americas', 'Europe']
        .map((region) => ({ region, items: hits.filter((c) => c.region === region) }))
        .filter((g) => g.items.length);
}

const words = ref<string | null>(null);
const wordSuggestions = ref<string[]>([]);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="ac-country">Country</label>
            <AutoComplete
                id="ac-country"
                v-model="single"
                :suggestions="singleSuggestions"
                option-label="name"
                placeholder="Type a country"
                @complete="singleSuggestions = match($event.query)"
            />
            <span class="demo-hint">Value: {{ typeof single === 'string' ? `"${single}"` : (single?.code ?? 'null') }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Dropdown and forced selection">
        <div class="demo-field">
            <label for="ac-forced">Country (from the list only)</label>
            <AutoComplete
                id="ac-forced"
                v-model="single"
                :suggestions="singleSuggestions"
                option-label="name"
                dropdown
                force-selection
                show-clear
                @complete="singleSuggestions = match($event.query)"
            />
        </div>
    </DemoSection>
    <DemoSection title="Multiple">
        <div class="demo-field" style="min-width: 22rem">
            <label for="ac-many">Countries</label>
            <AutoComplete id="ac-many" v-model="many" :suggestions="manySuggestions" option-label="name" multiple fluid @complete="manySuggestions = match($event.query)" />
        </div>
    </DemoSection>
    <DemoSection title="Groups and templates">
        <div class="demo-field">
            <label for="ac-grouped">Country by region</label>
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
                    <small class="demo-hint">{{ (option as Country).code }}</small>
                </template>
            </AutoComplete>
        </div>
    </DemoSection>
    <DemoSection title="Plain strings, sizes and states">
        <AutoComplete
            v-model="words"
            :suggestions="wordSuggestions"
            aria-label="Word"
            size="small"
            @complete="wordSuggestions = ['alpha', 'beta', 'gamma', 'delta'].filter((w) => w.includes($event.query))"
        />
        <AutoComplete :suggestions="[]" aria-label="Filled" variant="filled" />
        <AutoComplete :suggestions="[]" aria-label="Loading" loading />
        <AutoComplete :suggestions="[]" aria-label="Invalid" invalid />
        <AutoComplete :suggestions="[]" aria-label="Disabled" disabled model-value="Disabled" dropdown />
    </DemoSection>
</template>
