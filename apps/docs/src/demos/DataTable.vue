<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DataTable',
    category: 'Data',
    description:
        'Rows and columns: `<DataTable :value><Column field header sortable /></DataTable>`. Sorting (Ctrl-click adds a column), a filter row, a global search, pages, selection and loading, all computed by @vitral/core, or handed to a server (`lazy`) or a data source. A real <table> with scoped headers; sort buttons, checkboxes and filters are native controls in the tab order.'
};
</script>

<script setup lang="ts">
import { Column, createDataSource, DataTable, Icon, InputText, Select, useVitral, type LoadOptions } from '@vitral/vue';
import { queryData } from '@vitral/core';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

type Status = 'Active' | 'Away' | 'Offline' | 'Blocked';

interface Person {
    id: number;
    name: string;
    city: string;
    country: string;
    joined: Date;
    balance: number;
    status: Status;
}

// A small deterministic generator, so the demo shows the same people every time.
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;

const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Élise', 'Fatou', 'Gustavo', 'Hanna', 'Iñaki', 'João', 'Kenji', 'Lucía', 'Mateus', 'Noémie', 'Oskar', 'Paula', 'Quentin', 'Raquel', 'Søren', 'Tomás', 'Valéria', 'Wiktor', 'Ximena', 'Zoë'];
const lastNames = ['Souza', 'Lima', 'Mendes', 'Ferreira', 'Martin', 'Diallo', 'Rocha', 'Müller', 'Etxeberria', 'Pereira', 'Sato', 'Gómez', 'Nowak', 'Dubois', 'Jónsson', 'Costa', 'Fontaine', 'Álvarez'];
const places: [string, string][] = [
    ['São Paulo', 'Brazil'],
    ['Recife', 'Brazil'],
    ['Florianópolis', 'Brazil'],
    ['Lisboa', 'Portugal'],
    ['Évora', 'Portugal'],
    ['Montréal', 'Canada'],
    ['Québec', 'Canada'],
    ['München', 'Germany'],
    ['Köln', 'Germany'],
    ['Córdoba', 'Argentina'],
    ['Bogotá', 'Colombia'],
    ['Kraków', 'Poland'],
    ['Zürich', 'Switzerland'],
    ['Reykjavík', 'Iceland'],
    ['Tōkyō', 'Japan'],
    ['Málaga', 'Spain']
];
const statuses: Status[] = ['Active', 'Active', 'Active', 'Away', 'Offline', 'Blocked'];

const people: Person[] = Array.from({ length: 64 }, (_, i) => {
    const [city, country] = pick(places);
    return {
        id: i + 1,
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        city,
        country,
        joined: new Date(2019 + Math.floor(random() * 7), Math.floor(random() * 12), 1 + Math.floor(random() * 28)),
        balance: Math.round(random() * 2_000_000) / 100 - 2000,
        status: pick(statuses)
    };
});

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
const statusOptions: Status[] = ['Active', 'Away', 'Offline', 'Blocked'];

// ---- 1: everything local -----------------------------------------------------

const filters = ref({
    global: { value: null as string | null, matchMode: 'contains' },
    name: { value: null as string | null, matchMode: 'contains' },
    city: { value: null as string | null, matchMode: 'startsWith' },
    status: { value: null as Status | null, matchMode: 'equals' }
});
const selected = ref<Person[]>([]);

// ---- 2: multiple sort, single selection ----------------------------------------

const multiSortMeta = ref([
    { field: 'country', order: 1 as const },
    { field: 'balance', order: -1 as const }
]);
const chosen = ref<Person | null>(null);

// ---- 3: a remote data source ----------------------------------------------------

const requests = ref(0);
const remote = createDataSource<Person>({
    load: async (options: LoadOptions) => {
        requests.value++;
        await new Promise((resolve) => setTimeout(resolve, 450));
        return queryData(people, options);
    }
});
const remoteFilters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
</script>

<template>
    <DemoSection title="Sort, filter, page and select" description="Click a header to sort, type under it to filter (accents are ignored: “sao” finds São Paulo), search every column at once from the header, and tick rows.">
        <DataTable
            v-model:filters="filters"
            v-model:selection="selected"
            :value="people"
            data-key="id"
            caption="People"
            filter-display="row"
            :global-filter-fields="['name', 'city', 'country']"
            paginator
            :rows="8"
            :rows-per-page-options="[8, 16, 32]"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            removable-sort
            striped-rows
            class="demo-table"
        >
            <template #header>
                <div class="demo-table-bar">
                    <strong>People</strong>
                    <span class="demo-hint">{{ selected.length }} selected</span>
                    <InputText v-model="filters.global.value" placeholder="Search people" aria-label="Search people" size="small" clearable class="demo-table-search">
                        <template #prefix><Icon icon="search" /></template>
                    </InputText>
                </div>
            </template>
            <Column selection-mode="multiple" />
            <Column field="name" header="Name" sortable filter-placeholder="Name" />
            <Column field="city" header="City" sortable filter-placeholder="Starts with">
                <template #body="{ data }">
                    {{ data.city }} <span class="demo-muted">· {{ data.country }}</span>
                </template>
            </Column>
            <Column field="joined" header="Joined" sortable>
                <template #body="{ data }">{{ day.format(data.joined) }}</template>
            </Column>
            <Column field="balance" header="Balance" sortable align="right">
                <template #body="{ data }">
                    <span :class="{ 'demo-negative': data.balance < 0 }">{{ money.format(data.balance) }}</span>
                </template>
            </Column>
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <span class="demo-status"><span :class="['demo-dot', `demo-dot-${data.status.toLowerCase()}`]" aria-hidden="true" />{{ data.status }}</span>
                </template>
                <template #filter="{ filterModel }">
                    <Select v-if="filterModel && 'value' in filterModel" v-model="filterModel.value" :options="statusOptions" placeholder="Any" show-clear size="small" aria-label="Filter Status" fluid />
                </template>
            </Column>
        </DataTable>
    </DemoSection>

    <DemoSection title="Multiple sort, single selection, grid lines" description="Sorted by country, then by balance, highest first. Ctrl-click (⌘-click) a header to add it to the sort. Click a row, or focus the rows and use the arrows and Space, to choose one. The header stays in view while the body scrolls.">
        <DataTable
            v-model:multi-sort-meta="multiSortMeta"
            v-model:selection="chosen"
            :value="people"
            data-key="id"
            aria-label="People by country"
            sort-mode="multiple"
            selection-mode="single"
            size="small"
            show-gridlines
            scrollable
            scroll-height="320px"
            class="demo-table"
        >
            <Column field="name" header="Name" sortable />
            <Column field="country" header="Country" sortable />
            <Column field="city" header="City" sortable />
            <Column field="balance" header="Balance" sortable align="right">
                <template #body="{ data }">{{ money.format(data.balance) }}</template>
            </Column>
            <template #footer>
                <span>{{ chosen ? `${chosen.name}, ${chosen.city}` : 'No one chosen' }}</span>
            </template>
        </DataTable>
    </DemoSection>

    <DemoSection title="From a data source" description="The rows come from `createDataSource({ load })`, a stand-in for a server that answers in 450 ms. The table asks it for one page at a time with the sort and the search; a slow answer that arrives after a newer one is thrown away.">
        <DataTable :data-source="remote" v-model:filters="remoteFilters" :global-filter-fields="['name', 'city', 'country']" aria-label="Remote people" paginator :rows="6" :filter-delay="250" class="demo-table">
            <template #header>
                <div class="demo-table-bar">
                    <strong>Server</strong>
                    <span class="demo-hint">{{ requests }} requests</span>
                    <InputText v-model="remoteFilters.global.value" placeholder="Search" aria-label="Search the server" size="small" class="demo-table-search">
                        <template #prefix><Icon icon="search" /></template>
                    </InputText>
                </div>
            </template>
            <Column field="name" header="Name" sortable />
            <Column field="city" header="City" sortable />
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <span class="demo-status"><span :class="['demo-dot', `demo-dot-${data.status.toLowerCase()}`]" aria-hidden="true" />{{ data.status }}</span>
                </template>
            </Column>
        </DataTable>
    </DemoSection>

    <DemoSection title="Empty and loading">
        <DataTable :value="[]" aria-label="Empty table" empty-message="No invoices this month" class="demo-table demo-table-half">
            <Column field="number" header="Invoice" />
            <Column field="amount" header="Amount" align="right" />
        </DataTable>
        <DataTable :value="people.slice(0, 4)" aria-label="Loading table" loading class="demo-table demo-table-half">
            <Column field="name" header="Name" />
            <Column field="city" header="City" />
        </DataTable>
    </DemoSection>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-table-half {
    flex: 1 1 20rem;
    width: auto;
}

.demo-table-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.demo-table-search {
    margin-inline-start: auto;
    width: 16rem;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}

.demo-negative {
    color: var(--vt-danger-color);
}

.demo-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.demo-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 999px;
    background: var(--vt-text-muted-color);
}

.demo-dot-active {
    background: var(--vt-success-color);
}

.demo-dot-away {
    background: var(--vt-warn-color);
}

.demo-dot-blocked {
    background: var(--vt-danger-color);
}
</style>
