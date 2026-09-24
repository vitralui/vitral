<script setup lang="ts">
import { OrderList } from '@vitral/vue';
import { ref } from 'vue';

const cities = ref([
    { name: 'São Paulo', country: 'Brazil' },
    { name: 'Lisboa', country: 'Portugal' },
    { name: 'Luanda', country: 'Angola' },
    { name: 'Maputo', country: 'Mozambique' },
    { name: 'Praia', country: 'Cabo Verde' },
    { name: 'Dili', country: 'Timor-Leste' }
]);
const selection = ref([]);
</script>

<template>
    <OrderList v-model="cities" v-model:selection="selection" option-label="name" data-key="name" header="Trip order" scroll-height="16rem" style="max-width: 28rem">
        <template #option="{ item }">
            <div style="display: flex; justify-content: space-between; width: 100%">
                <span>{{ (item as { name: string }).name }}</span>
                <small style="color: var(--vt-text-muted-color)">{{ (item as { country: string }).country }}</small>
            </div>
        </template>
    </OrderList>
    <small style="color: var(--vt-text-muted-color)">Order: {{ cities.map((c) => c.name).join(' → ') }}</small>
</template>
