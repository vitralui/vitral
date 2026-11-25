<script setup lang="ts">
import { Column, DataGrid, SelectButton, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const shipments = [
    { id: 1, carrier: 'Northwind Freight', destination: 'Lisbon', weight: 1240, cost: 860 },
    { id: 2, carrier: 'Blue Harbor', destination: 'Porto', weight: 380, cost: 245 },
    { id: 3, carrier: 'Northwind Freight', destination: 'Madrid', weight: 2210, cost: 1490 },
    { id: 4, carrier: 'Cargo Lane', destination: 'Seville', weight: 760, cost: 530 }
];

const places = [
    { label: 'At the edge', value: 'edge' },
    { label: 'By the title', value: 'title' }
];
const tools = ref<'edge' | 'title'>('edge');
const info = ref<'edge' | 'title'>('title');
</script>

<template>
    <StackPanel spacing="0.75rem" style="width: 100%">
        <StackPanel orientation="horizontal" spacing="1.5rem" wrap>
            <StackPanel orientation="horizontal" spacing="0.5rem" align="center">
                <span class="demo-muted">Filter and menu</span>
                <SelectButton v-model="tools" :options="places" option-label="label" option-value="value" :allow-empty="false" size="small" aria-label="Filter and menu" />
            </StackPanel>
            <StackPanel orientation="horizontal" spacing="0.5rem" align="center">
                <span class="demo-muted">Info</span>
                <SelectButton v-model="info" :options="places" option-label="label" option-value="value" :allow-empty="false" size="small" aria-label="Info" />
            </StackPanel>
        </StackPanel>
        <DataGrid
            :value="shipments"
            data-key="id"
            aria-label="Shipments"
            :header-tools-at="tools"
            :header-info-at="info"
            filter-display="menu"
            column-menu
            resizable-columns
            show-gridlines
            class="demo-table"
        >
            <Column field="carrier" header="Carrier" :width="220" sortable filter="set" description="Who carries the load." />
            <Column field="destination" header="Destination" :width="200" sortable filter description="Where it is delivered." />
            <Column field="weight" header="Weight (kg)" :width="220" align="right" sortable filter description="Gross weight, packing included." />
            <!-- A column of its own: its info always by the title, whatever the grid says. -->
            <Column field="cost" header="Cost" :width="160" align="right" sortable filter header-info-at="title" header-tools-at="title" description="What the carrier charges." />
        </DataGrid>
    </StackPanel>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-muted {
    font-size: 0.875rem;
    color: var(--vt-text-muted-color);
}
</style>
