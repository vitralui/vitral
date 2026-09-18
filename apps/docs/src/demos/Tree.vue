<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tree',
    category: 'Data',
    description:
        'Hierarchical data. The WAI-ARIA tree view: one tab stop; Up/Down move, Right opens or enters a branch, Left closes it or goes to the parent, Home/End, * opens every sibling, typing jumps to a name, Enter/Space select or check.'
};
</script>

<script setup lang="ts">
import { setChecked, type TreeNode } from '@vitral/core';
import { Tree, type TreeNodeLike } from '@vitral/vue';
import { computed, ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const files: TreeNodeLike[] = [
    {
        key: 'docs',
        label: 'Documents',
        icon: 'folder',
        children: [
            {
                key: 'work',
                label: 'Work',
                icon: 'folder',
                children: [
                    { key: 'report', label: 'Relatório anual.pdf', icon: 'file', data: '2.4 MB' },
                    { key: 'budget', label: 'Orçamento 2026.xlsx', icon: 'file', data: '380 KB' },
                    { key: 'slides', label: 'Kick-off.pptx', icon: 'file', data: '11 MB' }
                ]
            },
            { key: 'home', label: 'Home', icon: 'folder', children: [{ key: 'recipes', label: 'Receitas da avó.docx', icon: 'file', data: '96 KB' }] },
            { key: 'cv', label: 'Currículo.pdf', icon: 'file', data: '210 KB' }
        ]
    },
    {
        key: 'pics',
        label: 'Pictures',
        icon: 'folder',
        children: [
            { key: 'evora', label: 'Évora, 2024', icon: 'folder', children: [{ key: 'temple', label: 'Templo romano.jpg', icon: 'file', data: '4.1 MB' }] },
            { key: 'reykjavik', label: 'Reykjavík.heic', icon: 'file', data: '3.3 MB' }
        ]
    },
    { key: 'music', label: 'Music', icon: 'folder', children: [{ key: 'fado', label: 'Fado — Amália.flac', icon: 'file', data: '38 MB' }] },
    { key: 'notes', label: 'Notes.md', icon: 'file', data: '4 KB' }
];

const expanded = ref<Record<string, boolean>>({ docs: true, work: true });
const selection = ref<Record<string, boolean>>({ budget: true });
const selectedLabel = computed(() => Object.keys(selection.value).join(', ') || 'nothing');

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

// Children that arrive only when a branch is first opened.
const servers = ref<TreeNodeLike[]>([
    { key: 'eu-west', label: 'eu-west-1 (Dublin)', icon: 'folder', leaf: false },
    { key: 'sa-east', label: 'sa-east-1 (São Paulo)', icon: 'folder', leaf: false },
    { key: 'ap-north', label: 'ap-northeast-1 (Tōkyō)', icon: 'folder', leaf: false }
]);

function loadChildren(node: TreeNodeLike) {
    if (node.children) return;
    node.loading = true;
    setTimeout(() => {
        node.children = ['api', 'worker', 'cache'].map((name, i) => ({ key: `${node.key}-${name}`, label: `${name}-${i + 1}.${node.key}`, icon: 'file' }));
        node.loading = false;
    }, 700);
}
</script>

<template>
    <DemoSection title="Single selection, custom content" description="The default slot draws each node: here, its size beside the name.">
        <div class="demo-tree-box">
            <Tree v-model:expanded-keys="expanded" v-model:selection-keys="selection" :value="files" selection-mode="single" aria-label="Files">
                <template #default="{ node }">
                    <span class="demo-tree-label">{{ node.label }}</span>
                    <span v-if="node.data" class="demo-tree-size">{{ node.data }}</span>
                </template>
            </Tree>
        </div>
        <span class="demo-hint">Selected: {{ selectedLabel }}</span>
    </DemoSection>

    <DemoSection title="Checkboxes" description="Checking a branch checks everything under it; a branch with some of its children checked is mixed (aria-checked=&quot;mixed&quot;). Ísland is disabled.">
        <div class="demo-tree-box">
            <Tree v-model:expanded-keys="regionsExpanded" v-model:selection-keys="checked" :value="regions" selection-mode="checkbox" aria-label="Offices" />
        </div>
        <span class="demo-hint">Cities checked: {{ checkedCities }}</span>
    </DemoSection>

    <DemoSection title="Filter" description="Matches stay, with the branches that lead to them opened. “evora” finds Évora.">
        <div class="demo-tree-box">
            <Tree :value="regions" filter filter-placeholder="Find a city" aria-label="Cities" scroll-height="18rem" />
        </div>
    </DemoSection>

    <DemoSection title="Lazy children" description="Each region is a branch (`leaf: false`) with no children yet; opening it emits `node-expand`, and the app loads them.">
        <div class="demo-tree-box">
            <Tree :value="servers" aria-label="Servers" selection-mode="multiple" @node-expand="loadChildren" />
        </div>
    </DemoSection>
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

.demo-tree-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.demo-tree-size {
    margin-inline-start: 0.75rem;
    font-size: 0.75rem;
    color: var(--vt-text-muted-color);
}
</style>
