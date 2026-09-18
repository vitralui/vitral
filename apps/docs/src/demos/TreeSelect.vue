<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TreeSelect',
    category: 'Form',
    description:
        'Select over a tree. The combobox opens a WAI-ARIA tree, the same `<Tree>` with its keyboard, filter and checkbox selection, and moves focus into it. A single choice closes the popup; Escape and Tab close it and give focus back.'
};
</script>

<script setup lang="ts">
import { TreeSelect, type TreeNode } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const files: TreeNode[] = [
    {
        key: 'docs',
        label: 'Documents',
        icon: 'folder',
        children: [
            { key: 'work', label: 'Work', icon: 'folder', children: [{ key: 'report', label: 'Relatório.pdf', icon: 'file' }, { key: 'budget', label: 'Budget.xlsx', icon: 'file' }] },
            { key: 'home', label: 'Home', icon: 'folder', children: [{ key: 'recipes', label: 'Recipes.txt', icon: 'file' }] }
        ]
    },
    { key: 'pics', label: 'Pictures', icon: 'folder', children: [{ key: 'trip', label: 'Trip to Évora.jpg', icon: 'file' }, { key: 'cat', label: 'Cat.png', icon: 'file' }] },
    { key: 'notes', label: 'Notes.md', icon: 'file' }
];

const single = ref<Record<string, boolean> | null>(null);
const checked = ref<Record<string, { checked: boolean; partialChecked: boolean }> | null>({ trip: { checked: true, partialChecked: false } });
const many = ref(null);
</script>

<template>
    <DemoSection title="Basic">
        <div class="demo-field">
            <label for="ts-single">File</label>
            <TreeSelect id="ts-single" v-model="single" :options="files" placeholder="Select a file" show-clear />
            <span class="demo-hint">Value: {{ JSON.stringify(single) }}</span>
        </div>
    </DemoSection>
    <DemoSection title="Checkboxes and chips">
        <div class="demo-field" style="min-width: 22rem">
            <label for="ts-check">Files</label>
            <TreeSelect id="ts-check" v-model="checked" :options="files" selection-mode="checkbox" display="chip" :max-selected-labels="4" fluid placeholder="Select files" />
        </div>
    </DemoSection>
    <DemoSection title="Filter and multiple">
        <div class="demo-field">
            <label for="ts-filter">Files</label>
            <TreeSelect id="ts-filter" v-model="many" :options="files" selection-mode="multiple" filter placeholder="Search files" />
        </div>
    </DemoSection>
    <DemoSection title="Sizes and states">
        <TreeSelect :options="files" placeholder="Small" size="small" aria-label="Small" />
        <TreeSelect :options="files" placeholder="Filled" variant="filled" aria-label="Filled" />
        <TreeSelect :options="files" placeholder="Invalid" invalid aria-label="Invalid" />
        <TreeSelect :options="files" placeholder="Disabled" disabled aria-label="Disabled" />
    </DemoSection>
</template>
