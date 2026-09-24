<script setup lang="ts">
import { Paginator, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const first = ref(40);
const rows = ref(20);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Paginator
            v-model:first="first"
            v-model:rows="rows"
            :total-records="1287"
            template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink RowsPerPageDropdown"
            :rows-per-page-options="[20, 50, 100]"
        />
        <Paginator v-model:first="first" v-model:rows="rows" :total-records="1287" template="PrevPageLink PageLinks NextPageLink CurrentPageReport" current-page-report-template="Page {page} of {pageCount}" :page-link-size="7" />
    </StackPanel>
</template>
