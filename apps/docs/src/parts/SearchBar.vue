<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { categoryName } from '../demo';
import { entries, entryText } from '../lib/catalog';
import { guides, guideText, sectionName } from '../lib/guides';
import { t } from '../lib/i18n';
import { navigate } from '../lib/router';
import { templates, templateText } from '../templates';

/**
 * The search, opened in the bar itself: the menus and the buttons step aside
 * and the field takes the width they held, with the results under it. A
 * dialog in the middle of the page took the reader away from where they
 * were looking to type three letters.
 *
 * Escape, a press outside, or a result closes it, and focus goes back to the
 * button that opened it.
 */
const open = defineModel<boolean>('open', { default: false });

interface Hit {
    label: string;
    hint: string;
    path: string;
}

const all = computed<Hit[]>(() => [
    { label: t('Components'), hint: t('Reference'), path: '/components' },
    { label: t('Icons'), hint: t('Reference'), path: '/icons' },
    { label: 'Templates', hint: t('Gallery'), path: '/templates' },
    ...templates.map((entry) => ({ label: entry.name, hint: t('{category} template', { category: templateText(entry).category }), path: `/templates/${entry.id}` })),
    ...guides.map((guide) => ({ label: guideText(guide).title, hint: sectionName(guide.meta.section), path: `/docs/${guide.id}` })),
    ...entries.map((entry) => ({ label: entryText(entry).title, hint: categoryName(entry.meta.category), path: `/components/${entry.id}` }))
]);

const iconOf = (path: string) => (path === '/icons' ? 'star' : path.startsWith('/docs') ? 'file' : path.startsWith('/templates') ? 'sidebar' : 'grip');

const query = ref('');
const active = ref(0);
const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);

const hits = computed(() => {
    const needle = query.value.trim().toLowerCase();
    if (!needle) return all.value.slice(0, 8);
    return all.value.filter((hit) => hit.label.toLowerCase().includes(needle) || hit.hint.toLowerCase().includes(needle)).slice(0, 12);
});

watch(query, () => (active.value = 0));

function close() {
    open.value = false;
    query.value = '';
    active.value = 0;
}

function go(hit?: Hit) {
    if (!hit) return;
    navigate(hit.path);
    close();
}

// The list is the combobox's popup: the input keeps focus and the keys move a
// marker through the options, which is what `aria-activedescendant` is for.
function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') active.value = (active.value + 1) % Math.max(hits.value.length, 1);
    else if (event.key === 'ArrowUp') active.value = (active.value - 1 + hits.value.length) % Math.max(hits.value.length, 1);
    else if (event.key === 'Enter') go(hits.value[active.value]);
    else if (event.key === 'Escape') close();
    else return;
    event.preventDefault();
}

function onPointerdown(event: Event) {
    if (!root.value?.contains(event.target as Node)) close();
}

onMounted(async () => {
    document.addEventListener('pointerdown', onPointerdown);
    await nextTick();
    input.value?.focus();
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerdown));
</script>

<template>
    <div ref="root" class="searchbar">
        <div class="searchbar-field" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-owns="site-search-list">
            <Icon icon="search" class="searchbar-icon" />
            <input
                ref="input"
                v-model="query"
                type="search"
                class="searchbar-input"
                :placeholder="t('Search components, guides and templates…')"
                :aria-label="t('Search the documentation')"
                aria-controls="site-search-list"
                :aria-activedescendant="hits[active] ? `site-search-${active}` : undefined"
                autocomplete="off"
                @keydown="onKeydown"
            />
            <button type="button" class="searchbar-close" :aria-label="t('Close the search')" @click="close">
                <Icon icon="close" />
            </button>
        </div>

        <div class="searchbar-results">
            <ul v-if="hits.length" id="site-search-list" class="search-list" role="listbox">
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
            <p v-else class="search-empty">{{ t('Nothing matches “{query}”.', { query }) }}</p>
        </div>
    </div>
</template>
