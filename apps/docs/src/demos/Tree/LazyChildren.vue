<script setup lang="ts">
import { Tree, type TreeNodeLike } from '@vitral/vue';
import { ref } from 'vue';

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
    <div class="demo-tree-box">
        <Tree :value="servers" aria-label="Servers" selection-mode="multiple" @node-expand="loadChildren" />
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
