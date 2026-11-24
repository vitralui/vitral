<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';
import { ref } from 'vue';

const people = ref([
    { id: 1, name: 'Ana Souza', email: 'ana@northwind.com', role: 'Designer', hours: 32 },
    { id: 2, name: 'Bruno Lima', email: 'bruno@northwind.com', role: 'Engineer', hours: 40 },
    { id: 3, name: 'Carla Mendes', email: 'carla@northwind.com', role: 'Manager', hours: 36 },
    { id: 4, name: 'Diego Ferreira', email: 'diego@northwind.com', role: 'Engineer', hours: 20 }
]);

const email = (value: unknown) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value ?? '')) ? true : 'Not an email address');
const hours = (value: unknown) => (typeof value === 'number' && value >= 0 && value <= 60 ? true : 'Between 0 and 60');
</script>

<template>
    <DataGrid :value="people" data-key="id" aria-label="Team" edit-mode="row" navigation="row" class="demo-table">
        <Column field="name" header="Name" editable />
        <Column field="email" header="Email" editable :validate="email" />
        <Column field="role" header="Role" editable />
        <Column field="hours" header="Hours a week" editable align="right" :validate="hours" />
        <Column column-key="edit" row-editor align="right" :width="96" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
