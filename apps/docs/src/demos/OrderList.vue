<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'OrderList',
    category: 'Data',
    description:
        'A list the reader puts in order: select items and move them with the buttons, with Alt and the arrow keys (Home and End for the ends), or by dragging. Every move is announced, which item went where.'
};
</script>

<script setup lang="ts">
import { OrderList } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

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
    <DemoSection title="Basic" class="stack">
        <OrderList v-model="cities" v-model:selection="selection" option-label="name" data-key="name" header="Trip order" scroll-height="16rem" style="max-width: 28rem">
            <template #option="{ item }">
                <div style="display: flex; justify-content: space-between; width: 100%">
                    <span>{{ (item as { name: string }).name }}</span>
                    <small class="demo-hint">{{ (item as { country: string }).country }}</small>
                </div>
            </template>
        </OrderList>
        <span class="demo-hint">Order: {{ cities.map((c) => c.name).join(' → ') }}</span>
    </DemoSection>
</template>
