<script setup lang="ts">
import { Button, Column, TreeTable, useVitral, type TreeNode } from '@vitral/vue';
import { computed, ref } from 'vue';

// Only the lines have amounts: every department and team adds up what is under it.
const line = (key: string, name: string, budget: number, spent: number): TreeNode => ({ key, data: { name, budget, spent } });
const costs: TreeNode[] = [
    {
        key: 'product',
        data: { name: 'Product' },
        children: [
            { key: 'web', data: { name: 'Web' }, children: [line('web-people', 'People', 180_000, 172_500), line('web-tools', 'Tools', 12_000, 14_300)] },
            { key: 'mobile', data: { name: 'Mobile' }, children: [line('mobile-people', 'People', 140_000, 128_000), line('mobile-devices', 'Test devices', 8_000, 6_150)] },
            line('design', 'Design', 60_000, 61_200)
        ]
    },
    {
        key: 'sales',
        data: { name: 'Sales' },
        children: [line('sales-people', 'People', 120_000, 118_900), line('sales-travel', 'Travel', 30_000, 22_750), line('sales-events', 'Events', 25_000, 31_400)]
    },
    { key: 'office', data: { name: 'Office' }, children: [line('rent', 'Rent', 48_000, 48_000), line('utilities', 'Utilities', 9_000, 8_420)] }
];

const table = ref<InstanceType<typeof TreeTable> | null>(null);
const expanded = ref<Record<string, boolean>>({ product: true });
const { config } = useVitral();
const money = computed(() => new Intl.NumberFormat(config.locale.code, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }));
// A share of the budget that was spent: on a department or a team, `data` holds its totals.
const share = (data: { budget?: number; spent?: number }) => (data.budget ? Math.round(((data.spent ?? 0) / data.budget) * 100) : 0);
</script>

<template>
    <TreeTable ref="table" v-model:expanded-keys="expanded" :value="costs" aria-label="Costs" size="small">
        <template #header>
            <div style="display: flex; gap: 0.5rem">
                <Button size="small" severity="secondary" variant="outlined" icon="plus" label="Expand all" @click="table?.expandAll()" />
                <Button size="small" severity="secondary" variant="outlined" icon="minus" label="Collapse all" @click="table?.collapseAll()" />
            </div>
        </template>
        <Column field="name" header="Cost" expander />
        <Column field="budget" header="Budget" aggregate="sum" align="right">
            <template #body="{ data }">{{ money.format(data.budget) }}</template>
        </Column>
        <Column field="spent" header="Spent" aggregate="sum" align="right">
            <template #body="{ data }">{{ money.format(data.spent) }}</template>
        </Column>
        <Column column-key="share" header="Used" align="right">
            <template #body="{ data }">
                <span :style="{ color: share(data) > 100 ? 'var(--vt-danger-color)' : undefined }">{{ share(data) }}%</span>
            </template>
        </Column>
    </TreeTable>
</template>
