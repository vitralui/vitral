<script setup lang="ts">
import { setChecked, type TreeNode } from '@vitral/core';
import { Tree, type TreeNodeLike } from '@vitral/vue';
import { computed, ref } from 'vue';

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

const regionsExpanded = ref<Record<string, boolean>>({ americas: true, br: true, europe: true });
// Start with São Paulo and Lisboa checked; core's setChecked marks the branches above them as partial.
const [americas, europe] = regions as [TreeNodeLike, TreeNodeLike];
const seeded = setChecked(regions as TreeNode[], {}, americas.children![0]!.children![0]! as TreeNode, true);
const checked = ref<Record<string, { checked: boolean; partialChecked: boolean }>>(setChecked(regions as TreeNode[], seeded, europe.children![0]!.children![0]! as TreeNode, true));
const cityKeys = new Set(regions.flatMap((r) => r.children!.flatMap((c) => c.children!.map((city) => city.key))));
const checkedCities = computed(() => Object.entries(checked.value).filter(([key, s]) => s.checked && cityKeys.has(key)).length);
</script>

<template>
    <div class="demo-tree-box">
        <Tree v-model:expanded-keys="regionsExpanded" v-model:selection-keys="checked" :value="regions" selection-mode="checkbox" aria-label="Offices" />
    </div>
    <small style="color: var(--vt-text-muted-color)">Cities checked: {{ checkedCities }}</small>
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
