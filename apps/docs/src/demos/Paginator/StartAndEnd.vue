<script setup lang="ts">
import { Paginator, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const first = ref(0);
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Paginator v-model:first="first" :rows="25" :total-records="340" template="PrevPageLink PageLinks NextPageLink" :page-link-size="3">
            <template #start="{ page, pageCount }">
                <small style="color: var(--vt-text-muted-color)">Invoices · page {{ page + 1 }} of {{ pageCount }}</small>
            </template>
            <template #end>
                <small style="color: var(--vt-text-muted-color)">340 invoices</small>
            </template>
        </Paginator>
    </StackPanel>
</template>
