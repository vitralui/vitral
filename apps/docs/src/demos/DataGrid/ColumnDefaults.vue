<script setup lang="ts">
import { Column, DataGrid } from '@vitral/vue';

const books = [
    { id: 1, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969, pages: 304, rating: 4.3 },
    { id: 2, title: 'Pedro Páramo', author: 'Juan Rulfo', year: 1955, pages: 124, rating: 4.1 },
    { id: 3, title: 'Beloved', author: 'Toni Morrison', year: 1987, pages: 324, rating: 4.0 },
    { id: 4, title: 'Grande Sertão: Veredas', author: 'João Guimarães Rosa', year: 1956, pages: 624, rating: 4.4 },
    { id: 5, title: 'Things Fall Apart', author: 'Chinua Achebe', year: 1958, pages: 209, rating: 3.9 },
    { id: 6, title: 'The Remains of the Day', author: 'Kazuo Ishiguro', year: 1989, pages: 258, rating: 4.1 }
];
</script>

<template>
    <!-- Every column sorts and filters by saying so once; the title and the author share the room left, two to one. -->
    <DataGrid :value="books" data-key="id" aria-label="Books" :column-defaults="{ sortable: true, filter: true }" filter-display="row" class="demo-table">
        <Column field="title" header="Title" :flex="2" />
        <Column field="author" header="Author" :flex="1" />
        <Column field="year" header="Year" align="right" :width="110" />
        <Column field="pages" header="Pages" align="right" :width="110" />
        <Column field="rating" header="Rating" align="right" :width="110" :sortable="false" :value-formatter="(value: unknown) => (value as number).toFixed(1)" />
    </DataGrid>
</template>

<style scoped>
.demo-table {
    width: 100%;
}
</style>
