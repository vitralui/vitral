<script setup lang="ts">
import { Label, StackPanel, TreeSelect, type TreeNode } from '@vitral/vue';
import { ref } from 'vue';

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
</script>

<template>
    <StackPanel spacing="0.375rem" style="min-width: 16rem">
        <Label for="ts-single">File</Label>
        <TreeSelect id="ts-single" v-model="single" :options="files" placeholder="Select a file" show-clear />
        <small style="color: var(--vt-text-muted-color)">Value: {{ JSON.stringify(single) }}</small>
    </StackPanel>
</template>
