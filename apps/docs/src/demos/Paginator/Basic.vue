<script setup lang="ts">
import { Paginator, StackPanel } from '@vitral/vue';
import { ref } from 'vue';

const first = ref(0);
const rows = ref(10);
const lastEvent = ref('');
</script>

<template>
    <StackPanel spacing="1rem" style="width: 100%">
        <Paginator
            v-model:first="first"
            v-model:rows="rows"
            :total-records="120"
            :rows-per-page-options="[10, 20, 50]"
            @page="lastEvent = `page ${$event.page + 1} of ${$event.pageCount}, first row ${$event.first}`"
        />
        <small style="color: var(--vt-text-muted-color)">first = {{ first }}, rows = {{ rows }}{{ lastEvent ? ` — ${lastEvent}` : '' }}</small>
    </StackPanel>
</template>
