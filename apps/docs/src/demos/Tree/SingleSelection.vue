<script setup lang="ts">
import { Tree, type TreeNodeLike } from '@vitral/vue';
import { computed, ref } from 'vue';

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
</script>

<template>
    <div class="demo-tree-box">
        <Tree v-model:expanded-keys="expanded" v-model:selection-keys="selection" :value="files" selection-mode="single" aria-label="Files">
            <template #default="{ node }">
                <span class="demo-tree-label">{{ node.label }}</span>
                <span v-if="node.data" class="demo-tree-size">{{ node.data }}</span>
            </template>
        </Tree>
    </div>
    <small style="color: var(--vt-text-muted-color)">Selected: {{ selectedLabel }}</small>
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
