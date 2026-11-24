<script setup lang="ts">
import { Button, Column, DataGrid, Icon, InputText, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Account {
    id: number;
    name: string;
    city: string;
    balance: number;
    status: 'Active' | 'Away' | 'Offline';
}

// A small deterministic generator, so the demo shows the same hundred thousand rows every time.
let seed = 11;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Élise', 'Fatou', 'Hanna', 'Iñaki', 'João', 'Kenji', 'Lucía', 'Noémie', 'Oskar', 'Søren', 'Valéria', 'Zoë'];
const lastNames = ['Souza', 'Lima', 'Mendes', 'Martin', 'Diallo', 'Rocha', 'Müller', 'Sato', 'Gómez', 'Nowak', 'Dubois', 'Costa'];
const cities = ['São Paulo', 'Lisboa', 'Montréal', 'München', 'Córdoba', 'Kraków', 'Zürich', 'Tōkyō', 'Málaga', 'Reykjavík'];
const statuses = ['Active', 'Active', 'Away', 'Offline'] as const;

const accounts: Account[] = Array.from({ length: 100_000 }, (_, i) => ({
    id: i + 1,
    name: `${pick(firstNames)} ${pick(lastNames)}`,
    city: pick(cities),
    balance: Math.round(random() * 5_000_000) / 100,
    status: pick(statuses)
}));

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR' }));
const count = computed(() => new Intl.NumberFormat(config.locale.code));

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const shown = ref(accounts.length);
const grid = ref<InstanceType<typeof DataGrid> | null>(null);
</script>

<template>
    <DataGrid
        ref="grid"
        v-model:filters="filters"
        :value="accounts"
        data-key="id"
        aria-label="Accounts"
        virtual-scroll
        scroll-height="420px"
        :global-filter-fields="['name', 'city']"
        size="small"
        striped-rows
        class="demo-table"
        @filter="shown = $event.filteredValue.length"
    >
        <template #header>
            <div class="demo-table-bar">
                <strong>{{ count.format(shown) }} accounts</strong>
                <Button size="small" severity="secondary" variant="outlined" @click="grid?.scrollToIndex(Math.floor(shown / 2))">Go to the middle</Button>
                <InputText v-model="filters.global.value" placeholder="Search accounts" aria-label="Search accounts" size="small" clearable class="demo-table-search">
                    <template #prefix><Icon icon="search" /></template>
                </InputText>
            </div>
        </template>
        <Column field="id" header="#" sortable align="right" />
        <Column field="name" header="Name" sortable />
        <Column field="city" header="City" sortable />
        <Column field="status" header="Status" sortable />
        <Column field="balance" header="Balance" sortable align="right">
            <template #body="{ data }">{{ money.format(data.balance) }}</template>
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
</style>
