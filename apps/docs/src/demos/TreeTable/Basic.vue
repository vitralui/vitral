<script setup lang="ts">
import { Column, TreeTable, type TreeNode } from '@vitral/vue';
import { ref } from 'vue';

const files: TreeNode[] = [
    {
        key: 'apps',
        data: { name: 'Applications', size: '300 MB', type: 'Folder' },
        children: [
            { key: 'vue', data: { name: 'Vue', size: '25 MB', type: 'Folder' }, children: [{ key: 'vue-app', data: { name: 'vue.app', size: '10 MB', type: 'Application' } }, { key: 'vue-cli', data: { name: 'cli', size: '15 MB', type: 'Application' } }] },
            { key: 'editor', data: { name: 'editor.app', size: '75 MB', type: 'Application' } }
        ]
    },
    {
        key: 'docs',
        data: { name: 'Documents', size: '75 KB', type: 'Folder' },
        children: [
            { key: 'work', data: { name: 'Work', size: '55 KB', type: 'Folder' }, children: [{ key: 'expenses', data: { name: 'Expenses.doc', size: '30 KB', type: 'Document' } }, { key: 'resume', data: { name: 'Resume.doc', size: '25 KB', type: 'Document' } }] },
            { key: 'invoices', data: { name: 'Invoices.txt', size: '20 KB', type: 'Text' } }
        ]
    },
    { key: 'music', data: { name: 'Música', size: '1.2 GB', type: 'Folder' }, children: [{ key: 'track', data: { name: 'Samba.mp3', size: '6 MB', type: 'Audio' } }] }
];

const expanded = ref<Record<string, boolean>>({ apps: true });
const selection = ref({});
</script>

<template>
    <TreeTable v-model:expanded-keys="expanded" v-model:selection-keys="selection" :value="files" selection-mode="checkbox" aria-label="Files">
        <Column field="name" header="Name" expander sortable />
        <Column field="size" header="Size" align="right" />
        <Column field="type" header="Type" sortable />
    </TreeTable>
    <small style="color: var(--vt-text-muted-color)">Selection: {{ Object.keys(selection).join(', ') || 'none' }}</small>
</template>
