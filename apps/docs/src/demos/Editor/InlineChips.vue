<script setup lang="ts">
import { Button, Editor, type ChipTrigger } from '@vitral/vue';
import { ref } from 'vue';

const text = ref(
    '<p>Ask <span data-chip="u1" data-kind="mention" contenteditable="false">Ana Souza</span> about the release, and tag it <span data-chip="t-urgent" data-kind="tag" contenteditable="false">urgent</span>. Type @ or # on the line below.</p><p></p>'
);
const editor = ref<InstanceType<typeof Editor> | null>(null);

const people = [
    { id: 'u1', label: 'Ana Souza', description: 'Product designer' },
    { id: 'u2', label: 'Bruno Lima', description: 'Engineer' },
    { id: 'u3', label: 'Carla Dias', description: 'Support' }
];

// One trigger a kind. `items` can answer at once, or later — here the tags
// stand in for a search on the server.
const chips: ChipTrigger[] = [
    { char: '@', kind: 'mention', items: (q) => people.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())) },
    {
        char: '#',
        kind: 'tag',
        items: (q) =>
            new Promise((resolve) =>
                setTimeout(() => resolve(['urgent', 'design', 'backend', q].filter((t, i, all) => t && all.indexOf(t) === i && t.includes(q.toLowerCase())).map((t) => ({ id: `t-${t}`, label: t }))), 150)
            )
    }
];

// A chip can be put in from code too: a variable a template fills in later.
function insertVariable(name: string) {
    editor.value?.editor?.run('insertChip', { id: name, label: name, kind: 'variable' });
    editor.value?.focus();
}
</script>

<template>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%">
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem">
            <Button label="first_name" icon="plus" size="small" variant="outlined" severity="secondary" @click="insertVariable('first_name')" />
            <Button label="order_id" icon="plus" size="small" variant="outlined" severity="secondary" @click="insertVariable('order_id')" />
        </div>
        <Editor ref="editor" v-model="text" :chips="chips" aria-label="Inline chips" style="width: 100%" />
    </div>
</template>
