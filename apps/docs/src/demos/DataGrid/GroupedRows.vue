<script setup lang="ts">
import { Button, Column, DataGrid, Icon, InputText, SelectButton, useVitral } from '@vitral/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

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

const groupField = ref<'country' | 'status'>('country');
const collapsed = ref<string[]>([]);
const boardFilters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const board = ref<HTMLElement | null>(null);
const wide = ref(false);

/** The browser's own full screen, so the grid gets the whole display and nothing else. */
async function toggleWide() {
    if (!document.fullscreenElement) await board.value?.requestFullscreen?.().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
}
const onFullscreen = () => (wide.value = !!document.fullscreenElement);
onMounted(() => document.addEventListener('fullscreenchange', onFullscreen));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFullscreen));
</script>

<template>
    <div ref="board" style="display: flex; flex-direction: column; gap: 1rem; width: 100%; background: var(--vt-content-background)">
        <div class="demo-table-bar">
            <SelectButton v-model="groupField" :options="[{ label: 'By country', value: 'country' }, { label: 'By status', value: 'status' }]" option-label="label" option-value="value" size="small" aria-label="Group by" />
            <InputText v-model="boardFilters.global.value" placeholder="Search" aria-label="Search rows" size="small" clearable class="demo-table-search">
                <template #prefix><Icon icon="search" /></template>
            </InputText>
            <small style="color: var(--vt-text-muted-color)">{{ collapsed.length }} shut</small>
            <Button :label="wide ? 'Close' : 'Full screen'" :icon="wide ? 'restore' : 'maximize'" severity="secondary" variant="outlined" size="small" @click="toggleWide" />
        </div>
        <DataGrid
            v-model:filters="boardFilters"
            v-model:collapsed-groups="collapsed"
            :value="people"
            :group-by="groupField"
            :group-label="({ value, count }) => `${value} · ${count}`"
            data-key="id"
            caption="People by group"
            :global-filter-fields="['name', 'city', 'country']"
            sort-field="name"
            :sort-order="1"
            removable-sort
            show-gridlines
            scrollable
            :scroll-height="wide ? 'calc(100vh - 8rem)' : '22rem'"
            class="demo-table"
        >
            <Column field="name" header="Name" sortable />
            <Column field="city" header="City" sortable />
            <Column field="country" header="Country" sortable />
            <Column field="status" header="Status" sortable>
                <template #body="{ data }">
                    <span class="demo-status"><span :class="['demo-dot', `demo-dot-${data.status.toLowerCase()}`]" aria-hidden="true" />{{ data.status }}</span>
                </template>
            </Column>
            <Column field="balance" header="Balance" sortable align="right">
                <template #body="{ data }">{{ money.format(data.balance) }}</template>
            </Column>
        </DataGrid>
    </div>
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
