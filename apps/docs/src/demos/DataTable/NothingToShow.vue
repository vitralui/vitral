<script setup lang="ts">
import { DataTable } from '@vitral/vue';
</script>

<template>
    <DataTable :value="[]" aria-label="No releases">
        <DataTable.Column field="version" header="Version" />
        <DataTable.Column field="name" header="Name" />
        <DataTable.Empty>No releases yet. The first one is on its way.</DataTable.Empty>
    </DataTable>
</template>
