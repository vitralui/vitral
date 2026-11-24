<script setup lang="ts">
import { Column, DataGrid, Tag, useVitral, type ColumnLayoutLike } from '@vitral/vue';
import { computed, ref } from 'vue';

interface Employee {
    id: number;
    name: string;
    team: string;
    role: string;
    city: string;
    level: number;
    salary: number;
    started: Date;
    remote: boolean;
}

const names = ['Ana Souza', 'Bruno Lima', 'Carla Mendes', 'Diego Ferreira', 'Elisa Rocha', 'Fábio Nunes', 'Gabriela Dias', 'Hugo Martins', 'Inês Prado', 'João Vieira'];
const teams = ['Platform', 'Design', 'Data', 'Sales'];
const roles = ['Engineer', 'Lead', 'Analyst', 'Manager'];
const cities = ['Lisbon', 'Porto', 'São Paulo', 'Recife', 'Berlin'];

const people = ref<Employee[]>(
    Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `${names[i % names.length]!}${i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''}`,
        team: teams[(i * 3) % teams.length]!,
        role: roles[(i * 7) % roles.length]!,
        city: cities[(i * 3 + 1) % cities.length]!,
        level: (i % 5) + 1,
        salary: 42_000 + ((i * 3_700) % 58_000),
        started: new Date(2018 + (i % 8), (i * 5) % 12, ((i * 7) % 27) + 1),
        remote: i % 3 === 0
    }))
);

// Some columns start hidden: the columns panel brings them back.
const layout = ref<ColumnLayoutLike | null>({ hidden: ['level', 'started'] });

const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
const day = computed(() => new Intl.DateTimeFormat(config.locale.code, { dateStyle: 'medium' }));
</script>

<template>
    <DataGrid
        v-model:column-layout="layout"
        :value="people"
        data-key="id"
        aria-label="Team directory"
        side-bar
        side-bar-open="columns"
        paginator
        :rows="10"
        size="small"
        class="demo-table"
    >
        <Column field="name" header="Name" sortable filter :toggleable="false" />
        <Column field="team" header="Team" sortable filter="set" />
        <Column field="role" header="Role" filter="set" />
        <Column field="city" header="City" sortable filter="set" />
        <Column field="level" header="Level" sortable filter align="right" />
        <Column field="salary" header="Salary" sortable filter align="right">
            <template #body="{ data }">{{ money.format(data.salary) }}</template>
        </Column>
        <Column field="started" header="Started" sortable filter>
            <template #body="{ data }">{{ day.format(data.started) }}</template>
        </Column>
        <Column field="remote" header="Remote" filter="set">
            <template #body="{ data }"><Tag :value="data.remote ? 'Remote' : 'Office'" :severity="data.remote ? 'info' : 'secondary'" /></template>
        </Column>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
