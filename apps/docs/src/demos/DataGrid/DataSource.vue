<script setup lang="ts">
import { queryData } from '@vitral/core';
import { Column, createDataSource, DataGrid, Icon, InputText, type LoadOptions } from '@vitral/vue';
import { ref } from 'vue';

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

// A stand-in for a server: it answers in 450 ms with one page, sorted and searched.
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
    <DataGrid :data-source="remote" v-model:filters="remoteFilters" :global-filter-fields="['name', 'city', 'country']" aria-label="Remote people" paginator :rows="6" :filter-delay="250" class="demo-table">
        <template #header>
            <div class="demo-table-bar">
                <strong>Server</strong>
                <small style="color: var(--vt-text-muted-color)">{{ requests }} requests</small>
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
