<script setup lang="ts">
import { Dialog, Icon, InputText } from '@vitral/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { entries } from '../lib/catalog';
import { guides } from '../lib/guides';
import { navigate } from '../lib/router';
import { templates } from '../templates';

const visible = defineModel<boolean>('visible', { default: false });

interface Hit {
    label: string;
    hint: string;
    path: string;
}

const all = computed<Hit[]>(() => [
    { label: 'Icons', hint: 'Reference', path: '/icons' },
    { label: 'Templates', hint: 'Gallery', path: '/templates' },
    ...templates.map((entry) => ({ label: entry.name, hint: `${entry.category} template`, path: `/templates/${entry.id}` })),
    ...guides.map((guide) => ({ label: guide.meta.title, hint: guide.meta.section, path: `/docs/${guide.id}` })),
    ...entries.map((entry) => ({ label: entry.meta.title, hint: entry.meta.category, path: `/components/${entry.id}` }))
]);

const iconOf = (path: string) => (path === '/icons' ? 'star' : path.startsWith('/docs') ? 'file' : path.startsWith('/templates') ? 'sidebar' : 'grip');

const query = ref('');
const active = ref(0);
const input = ref<InstanceType<typeof InputText> | null>(null);

const hits = computed(() => {
    const needle = query.value.trim().toLowerCase();
    if (!needle) return all.value.slice(0, 8);
    return all.value.filter((hit) => hit.label.toLowerCase().includes(needle) || hit.hint.toLowerCase().includes(needle)).slice(0, 12);
});

watch(query, () => (active.value = 0));
watch(visible, async (open) => {
    if (!open) return;
    query.value = '';
    active.value = 0;
    await nextTick();
    input.value?.focus();
});

function go(hit?: Hit) {
    if (!hit) return;
    navigate(hit.path);
    visible.value = false;
}

// The list is the combobox's popup: the input keeps focus and the keys move a
// marker through the options, which is what `aria-activedescendant` is for.
function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') active.value = (active.value + 1) % Math.max(hits.value.length, 1);
    else if (event.key === 'ArrowUp') active.value = (active.value - 1 + hits.value.length) % Math.max(hits.value.length, 1);
    else if (event.key === 'Enter') go(hits.value[active.value]);
    else return;
    event.preventDefault();
}
</script>

<template>
    <Dialog v-model:visible="visible" position="top" :show-header="false" dismissable-mask aria-label="Search the documentation" :pt="{ root: { style: 'width: 34rem; max-width: calc(100vw - 2rem); margin-top: 6vh' } }">
        <div role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-owns="site-search-list">
            <InputText
                ref="input"
                v-model="query"
                placeholder="Search components, guides and templates…"
                aria-label="Search"
                aria-controls="site-search-list"
                :aria-activedescendant="hits[active] ? `site-search-${active}` : undefined"
                fluid
                @keydown="onKeydown"
            />
            <ul v-if="hits.length" id="site-search-list" class="search-list" role="listbox" style="list-style: none; padding-left: 0">
                <li v-for="(hit, index) in hits" :key="hit.path" role="presentation">
                    <button
                        :id="`site-search-${index}`"
                        class="search-item"
                        :class="{ on: index === active }"
                        type="button"
                        role="option"
                        :aria-selected="index === active"
                        tabindex="-1"
                        @click="go(hit)"
                        @mousemove="active = index"
                    >
                        <Icon :icon="iconOf(hit.path)" />
                        {{ hit.label }}
                        <small>{{ hit.hint }}</small>
                    </button>
                </li>
            </ul>
            <p v-else class="search-empty">Nothing matches “{{ query }}”.</p>
        </div>
    </Dialog>
</template>
