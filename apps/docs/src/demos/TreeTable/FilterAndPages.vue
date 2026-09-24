<script setup lang="ts">
import { Column, InputText, TreeTable, type TreeNode } from '@vitral/vue';
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

const query = ref('');
</script>

<template>
    <InputText v-model="query" placeholder="Filter by name" aria-label="Filter by name" style="align-self: flex-start" />
    <TreeTable :value="files" :global-filter="query" :global-filter-fields="['name']" paginator :rows="2" striped-rows show-gridlines selection-mode="single" aria-label="Files, filtered">
        <Column field="name" header="Name" expander />
        <Column field="type" header="Type" />
    </TreeTable>
</template>
