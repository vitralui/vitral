<script setup lang="ts">
import { Column, DataGrid, Icon, InputText, Select, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

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

const filters = ref({
    global: { value: null as string | null, matchMode: 'contains' },
    name: { value: null as string | null, matchMode: 'contains' },
    city: { value: null as string | null, matchMode: 'startsWith' },
    status: { value: null as Status | null, matchMode: 'equals' }
});
const selected = ref<Person[]>([]);
</script>

<template>
    <DataGrid
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
                <small style="color: var(--vt-text-muted-color)">{{ selected.length }} selected</small>
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
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
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
