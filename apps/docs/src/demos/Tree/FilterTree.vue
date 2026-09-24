<script setup lang="ts">
import { Tree, type TreeNodeLike } from '@vitral/vue';

const regions: TreeNodeLike[] = [
    {
        key: 'americas',
        label: 'Americas',
        children: [
            { key: 'br', label: 'Brasil', children: [{ key: 'sp', label: 'São Paulo' }, { key: 'rj', label: 'Rio de Janeiro' }, { key: 'poa', label: 'Porto Alegre' }] },
            { key: 'ca', label: 'Canada', children: [{ key: 'mtl', label: 'Montréal' }, { key: 'qc', label: 'Québec' }] },
            { key: 'co', label: 'Colombia', children: [{ key: 'bog', label: 'Bogotá' }] }
        ]
    },
    {
        key: 'europe',
        label: 'Europe',
        children: [
            { key: 'pt', label: 'Portugal', children: [{ key: 'lis', label: 'Lisboa' }, { key: 'opo', label: 'Porto' }, { key: 'evo', label: 'Évora' }] },
            { key: 'de', label: 'Deutschland', children: [{ key: 'muc', label: 'München' }, { key: 'cgn', label: 'Köln' }] },
            { key: 'is', label: 'Ísland', children: [{ key: 'rey', label: 'Reykjavík' }], disabled: true }
        ]
    }
];
</script>

<template>
    <div class="demo-tree-box">
        <Tree :value="regions" filter filter-placeholder="Find a city" aria-label="Cities" scroll-height="18rem" />
    </div>
</template>

<style scoped>
.demo-tree-box {
    width: 22rem;
    max-width: 100%;
    padding: 0.25rem;
    background: var(--vt-content-background);
    border: 1px solid var(--vt-content-border-color);
    border-radius: var(--vt-content-border-radius);
}
</style>
