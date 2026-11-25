<script setup lang="ts">
import { Button, Column, DataGrid } from '@vitral/vue';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
</script>

<template>
    <DataGrid :value="[]" aria-label="Budget by month" scrollable resizable-columns show-gridlines class="demo-table">
        <Column field="account" header="Account" :width="200" pinned="left" />
        <Column v-for="month in months" :key="month" :field="month.toLowerCase()" :header="month" :width="110" align="right" />
        <template #empty>
            <div class="demo-empty">
                <span>No budget lines yet.</span>
                <Button size="small" icon="plus" label="Add a line" />
            </div>
        </template>
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}

.demo-empty {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}
</style>
