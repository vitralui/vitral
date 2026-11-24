<script setup lang="ts">
import { Paginator } from '@vitral/vue';
import { ref } from 'vue';

const first = ref(0);
const rows = ref(25);
</script>

<template>
    <Paginator
        v-model:first="first"
        v-model:rows="rows"
        :total-records="4310"
        template="FirstPageLink PrevPageLink PageInput NextPageLink LastPageLink RowsPerPageLabel RowsPerPageDropdown"
        :rows-per-page-options="[25, 50, 100]"
    />
</template>
