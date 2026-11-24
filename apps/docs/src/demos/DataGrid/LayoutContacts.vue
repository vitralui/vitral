<script setup lang="ts">
import { Avatar, Column, DataGrid, Icon, InputText, Tag, useVitral } from '@vitral/vue';
import { computed, ref } from 'vue';

type Stage = 'Lead' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

interface Contact {
    id: number;
    name: string;
    email: string;
    company: string;
    stage: Stage;
    value: number;
    lastContact: Date;
}

let seed = 23;
const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]!;
const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Élise', 'Fatou', 'Hanna', 'Iñaki', 'João', 'Kenji', 'Lucía', 'Noémie', 'Oskar', 'Paula', 'Søren', 'Zoë'];
const lastNames = ['Souza', 'Lima', 'Mendes', 'Martin', 'Diallo', 'Rocha', 'Müller', 'Sato', 'Gómez', 'Nowak', 'Dubois', 'Costa'];
const companies = ['Northwind', 'Ferro & Filhos', 'Blue Harbor', 'Kestrel Labs', 'Atelier Lumen', 'Pampa Foods', 'Fjord Logistics', 'Orbital Print'];
const stages: Stage[] = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];
const ascii = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const contacts: Contact[] = Array.from({ length: 48 }, (_, i) => {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const company = pick(companies);
    return {
        id: i + 1,
        name: `${first} ${last}`,
        email: `${ascii(first)}.${ascii(last)}@${ascii(company).replace(/[^a-z]/g, '')}.com`,
        company,
        stage: pick(stages),
        value: Math.round(random() * 90) * 500 + 1000,
        lastContact: new Date(2026, 9 + Math.floor(random() * 2), 1 + Math.floor(random() * 28))
    };
});

const severity: Record<Stage, 'secondary' | 'info' | 'warn' | 'success' | 'danger'> = { Lead: 'secondary', Qualified: 'info', Proposal: 'warn', Won: 'success', Lost: 'danger' };
const initials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('');

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { day: 'numeric', month: 'short' }));

const filters = ref({ global: { value: null as string | null, matchMode: 'contains' } });
const selected = ref<Contact[]>([]);
</script>

<template>
    <DataGrid
        v-model:filters="filters"
        v-model:selection="selected"
        :value="contacts"
        data-key="id"
        aria-label="Contacts"
        :global-filter-fields="['name', 'email', 'company', 'stage']"
        paginator
        :rows="6"
        size="large"
        removable-sort
        class="demo-table"
    >
        <template #header>
            <div class="demo-table-bar">
                <strong>Contacts</strong>
                <Tag v-if="selected.length" :value="`${selected.length} selected`" severity="info" rounded />
                <InputText v-model="filters.global.value" placeholder="Search contacts" aria-label="Search contacts" clearable class="demo-table-search">
                    <template #prefix><Icon icon="search" /></template>
                </InputText>
            </div>
        </template>
        <Column selection-mode="multiple" />
        <Column field="name" header="Contact" sortable>
            <template #body="{ data }">
                <span class="demo-person">
                    <Avatar :label="initials(data.name)" shape="circle" />
                    <span class="demo-person-text">
                        <strong>{{ data.name }}</strong>
                        <small class="demo-muted">{{ data.company }} · {{ data.email }}</small>
                    </span>
                </span>
            </template>
        </Column>
        <Column field="stage" header="Stage" sortable>
            <template #body="{ data }"><Tag :value="data.stage" :severity="severity[data.stage as Stage]" /></template>
        </Column>
        <Column field="value" header="Deal" sortable align="right">
            <template #body="{ data }">{{ money.format(data.value) }}</template>
        </Column>
        <Column field="lastContact" header="Last contact" sortable align="right">
            <template #body="{ data }"><span class="demo-muted">{{ day.format(data.lastContact) }}</span></template>
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

.demo-person {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
}

.demo-person-text {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
}

.demo-muted {
    color: var(--vt-text-muted-color);
}
</style>
