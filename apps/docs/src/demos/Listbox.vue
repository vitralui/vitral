<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Listbox',
    category: 'Data',
    description:
        'A list to choose from, always open — Select’s sibling. The WAI-ARIA listbox: arrows, Home/End and typeahead move (and, in single mode, select); in multiple mode Space toggles, Shift+arrows extend, Shift-click selects a range and Ctrl+A selects all.'
};
</script>

<script setup lang="ts">
import { Listbox } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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

const languages = [
    { name: 'Português', code: 'pt' },
    { name: 'English', code: 'en' },
    { name: 'Español', code: 'es' },
    { name: 'Français', code: 'fr' },
    { name: 'Deutsch', code: 'de' },
    { name: 'Íslenska', code: 'is' },
    { name: 'Polski', code: 'pl' },
    { name: '日本語 (Japanese)', code: 'ja' },
    { name: 'Wolof', code: 'wo' },
    { name: 'Euskara', code: 'eu' }
];

const byCountry = [
    { country: 'Brasil', cities: [{ name: 'São Paulo' }, { name: 'Recife' }, { name: 'Florianópolis' }] },
    { country: 'Portugal', cities: [{ name: 'Lisboa' }, { name: 'Coimbra' }] },
    { country: 'Canada', cities: [{ name: 'Montréal' }, { name: 'Québec' }] }
];

const statuses = [
    { label: 'Online', value: 'online', tone: 'success' },
    { label: 'Away', value: 'away', tone: 'warn' },
    { label: 'Busy', value: 'busy', tone: 'danger' },
    { label: 'Offline', value: 'offline', tone: 'muted' }
];

const city = ref<string | null>('LIS');
const spoken = ref<string[]>(['pt', 'en']);
const grouped = ref<unknown>(null);
const status = ref('online');
</script>

<template>
    <DemoSection title="Single" description="Selection follows the arrows, as in a native list box. Évora is disabled.">
        <div class="demo-field">
            <label id="lb-city-label">Airport</label>
            <Listbox v-model="city" :options="cities" option-label="name" option-value="code" option-disabled="off" checkmark aria-labelledby="lb-city-label" scroll-height="14rem" />
            <span class="demo-hint">Value: {{ city ?? 'null' }}</span>
        </div>
    </DemoSection>

    <DemoSection title="Multiple, with a filter" description="Search ignores accents and case: “ingles” is not needed, “espanol” finds Español.">
        <div class="demo-field">
            <label id="lb-lang-label">Languages spoken</label>
            <Listbox v-model="spoken" :options="languages" option-label="name" option-value="code" multiple filter checkmark aria-labelledby="lb-lang-label" scroll-height="12rem" />
            <span class="demo-hint">Value: {{ spoken.join(', ') || 'none' }}</span>
        </div>
    </DemoSection>

    <DemoSection title="Groups and custom options">
        <div class="demo-field">
            <label id="lb-group-label">City by country</label>
            <Listbox v-model="grouped" :options="byCountry" option-group-label="country" option-group-children="cities" option-label="name" aria-labelledby="lb-group-label" scroll-height="14rem" />
        </div>
        <div class="demo-field">
            <label id="lb-status-label">Status</label>
            <Listbox v-model="status" :options="statuses" option-label="label" option-value="value" aria-labelledby="lb-status-label">
                <template #option="{ option }">
                    <span :class="['demo-dot', `demo-dot-${(option as { tone: string }).tone}`]" aria-hidden="true" />
                    <span>{{ (option as { label: string }).label }}</span>
                </template>
            </Listbox>
        </div>
    </DemoSection>

    <DemoSection title="States">
        <Listbox :options="cities.slice(0, 4)" option-label="name" invalid aria-label="Invalid" />
        <Listbox :model-value="cities[2]" :options="cities.slice(0, 4)" option-label="name" disabled aria-label="Disabled" />
    </DemoSection>
</template>

<style scoped>
.demo-dot {
    width: 0.5rem;
    height: 0.5rem;
    flex-shrink: 0;
    border-radius: 999px;
    background: var(--vt-text-muted-color);
}

.demo-dot-success {
    background: var(--vt-success-color);
}

.demo-dot-warn {
    background: var(--vt-warn-color);
}

.demo-dot-danger {
    background: var(--vt-danger-color);
}
</style>
