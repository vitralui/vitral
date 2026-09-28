<script setup lang="ts">
import { createRoot } from '@vitral/dom';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useEditorContext } from './context';
import type { EditorFindProps } from './types';

// The find bar, where it is placed: under the toolbar in the ready-made
// editor. It is `@vitral/editor`'s own bar, drawn into this element, so the
// framework-free editor and this one find and replace the same way.

defineOptions({ name: 'VtEditorFind' });

defineProps<EditorFindProps>();
const ctx = useEditorContext('EditorFind');
const host = ref<HTMLElement | null>(null);

onMounted(() => {
    const root = createRoot(host.value!);
    const render = () => root.render([ctx.find.view()]);
    ctx.registerFind(render);
    render();
    onBeforeUnmount(() => {
        ctx.registerFind(null);
        root.clear();
    });
});
</script>

<template>
    <div ref="host" style="display: contents" />
</template>
