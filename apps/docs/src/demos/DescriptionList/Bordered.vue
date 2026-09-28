<script setup lang="ts">
import { Button, DescriptionList, Tag } from '@vitral/vue';

const items = [
    { key: 'order', label: 'Order', value: '#1042' },
    { key: 'status', label: 'Status', value: 'Shipped' },
    { key: 'placed', label: 'Placed', value: '14 Sep 2026' },
    { key: 'total', label: 'Total', value: '$ 318.00' },
    { key: 'address', label: 'Ship to', value: 'Rua das Flores 120, São Paulo', span: 2 }
];
</script>

<template>
    <DescriptionList title="Order details" :items="items" :columns="2" bordered style="width: 100%">
        <template #extra><Button label="Edit" icon="pencil" size="small" variant="outlined" severity="secondary" /></template>
        <template #value="{ item }">
            <Tag v-if="item.key === 'status'" :value="String(item.value)" severity="success" />
            <template v-else>{{ item.value }}</template>
        </template>
    </DescriptionList>
</template>
