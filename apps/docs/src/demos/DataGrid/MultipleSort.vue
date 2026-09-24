<script setup lang="ts">
import { Column, DataGrid, useVitral } from '@vitral/vue';
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

const multiSortMeta = ref([
    { field: 'country', order: 1 as const },
    { field: 'balance', order: -1 as const }
]);
const chosen = ref<Person | null>(null);
</script>

<template>
    <DataGrid
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
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
