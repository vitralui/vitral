<script setup lang="ts">
import { DataTable } from '@vitral/vue';

interface Release {
    version: string;
    name: string;
    published: string;
    downloads: number;
}

const releases: Release[] = [
    { version: '0.4.0', name: 'Spreadsheet', published: '2026-08-14', downloads: 12840 },
    { version: '0.3.2', name: 'Taskboard', published: '2026-06-02', downloads: 9310 },
    { version: '0.3.0', name: 'Schedule', published: '2026-04-21', downloads: 24105 },
    { version: '0.2.1', name: 'Chart', published: '2026-02-09', downloads: 31760 },
    { version: '0.2.0', name: 'Editor', published: '2025-12-18', downloads: 8422 },
    { version: '0.1.0', name: 'Foundations', published: '2025-10-30', downloads: 4190 }
];

const number = new Intl.NumberFormat('en-US');
const date = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
</script>

<template>
    <DataTable :value="releases" data-key="version" striped-rows row-hover aria-label="Releases by column">
        <DataTable.Column field="version" header="Version" sortable />
        <DataTable.Column field="name" header="Name" sortable />
        <DataTable.Column field="published" header="Published" sortable>
            <template #body="{ data }">{{ date((data as Release).published) }}</template>
        </DataTable.Column>
        <DataTable.Column field="downloads" header="Downloads" sortable align="right">
            <template #body="{ data }">{{ number.format((data as Release).downloads) }}</template>
        </DataTable.Column>
    </DataTable>
</template>
