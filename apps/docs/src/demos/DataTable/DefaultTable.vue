<script setup lang="ts">
import { DataTable } from '@vitral/vue';

const releases = [
    { version: '0.4.0', name: 'Spreadsheet', published: '2026-08-14', downloads: 12840 },
    { version: '0.3.2', name: 'Taskboard', published: '2026-06-02', downloads: 9310 },
    { version: '0.3.0', name: 'Schedule', published: '2026-04-21', downloads: 24105 },
    { version: '0.2.1', name: 'Chart', published: '2026-02-09', downloads: 31760 },
    { version: '0.2.0', name: 'Editor', published: '2025-12-18', downloads: 8422 },
    { version: '0.1.0', name: 'Foundations', published: '2025-10-30', downloads: 4190 }
];
</script>

<template>
    <DataTable :value="releases" data-key="version" aria-label="Releases">
        <DataTable.Column field="version" header="Version" />
        <DataTable.Column field="name" header="Name" />
        <DataTable.Column field="published" header="Published" />
    </DataTable>
</template>
