<script setup lang="ts">
import { TreeSelect, type TreeNode } from '@vitral/vue';

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
</script>

<template>
    <TreeSelect :options="files" placeholder="Small" size="small" aria-label="Small" />
    <TreeSelect :options="files" placeholder="Filled" variant="filled" aria-label="Filled" />
    <TreeSelect :options="files" placeholder="Invalid" invalid aria-label="Invalid" />
    <TreeSelect :options="files" placeholder="Disabled" disabled aria-label="Disabled" />
</template>
