<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { categoryName } from '../demo';
import { track } from '../lib/analytics';
import { entries, entryText, sectionText } from '../lib/catalog';
import { componentChange, type Change } from '../lib/changes';
import { guides, guideText, sectionName } from '../lib/guides';
import { lang, t } from '../lib/i18n';
import { navigate } from '../lib/router';
import { slugify } from '../lib/section';
import { templates, templateText } from '../templates';
import ChangeBadge from './ChangeBadge.vue';

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
    /** An example on the page, to land on rather than its top. */
    hash?: string;
    /** A component the last few releases added or changed. */
    change?: Change;
}

const all = computed<Hit[]>(() => [
    { label: t('Components'), hint: t('Reference'), path: '/components' },
    { label: t('Icons'), hint: t('Reference'), path: '/icons' },
    { label: t("What's new"), hint: t('Reference'), path: '/releases' },
    { label: 'Templates', hint: t('Gallery'), path: '/templates' },
    ...templates.map((entry) => ({ label: entry.name, hint: t('{category} template', { category: templateText(entry).category }), path: `/templates/${entry.id}` })),
    ...guides.map((guide) => ({ label: guideText(guide).title, hint: sectionName(guide.meta.section), path: `/docs/${guide.id}` })),
    ...entries.map((entry) => ({ label: entryText(entry).title, hint: categoryName(entry.meta.category), path: `/components/${entry.id}`, change: componentChange(entry.file) }))
]);

/**
 * Every example on every component's page, found only by a search: "pinned
 * columns" goes to the example that shows them, which a reader looking for
 * how to do something wants more than the component's name.
 */
const translated = shallowRef<Record<string, Record<string, Record<string, string>>>>({});
import('virtual:vitral-section-titles').then((module) => (translated.value = module.titles)).catch(() => {});

const examples = computed<Hit[]>(() =>
    entries.flatMap((entry) =>
        entry.sections.map((title) => ({
            // The page's own words when it is open, else the titles fetched for the search, else the English.
            label: translated.value[lang.value]?.[entry.id]?.[title] ?? sectionText(entry, title).title,
            hint: entryText(entry).title,
            path: `/components/${entry.id}`,
            hash: `#${slugify(title)}`
        }))
    )
);

// Without case or accents: "selecao" finds "seleção".
const plain = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const iconOf = (hit: Hit) =>
    hit.hash ? 'hash' : hit.path === '/icons' ? 'star' : hit.path.startsWith('/docs') ? 'file' : hit.path.startsWith('/templates') ? 'sidebar' : 'grip';

const query = ref('');
const active = ref(0);
const root = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);

/*
 * Every word has to be found in a hit's name or what it belongs to. Pages come
 * before examples, and among each, a name that starts with what was typed
 * before one that only has it somewhere.
 */
const hits = computed(() => {
    const words = plain(query.value).split(/\s+/).filter(Boolean);
    if (!words.length) return all.value.slice(0, 8);
    const rank = (hit: Hit, base: number) => {
        const label = plain(hit.label);
        const text = `${label} ${plain(hit.hint)}`;
        if (!words.every((word) => text.includes(word))) return -1;
        return base + (label.startsWith(words[0]!) ? 0 : words.every((word) => label.includes(word)) ? 1 : 2);
    };
    return [...all.value.map((hit) => [hit, rank(hit, 0)] as const), ...examples.value.map((hit) => [hit, rank(hit, 3)] as const)]
        .filter(([, score]) => score >= 0)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 12)
        .map(([hit]) => hit);
});

watch(query, () => (active.value = 0));

function close() {
    open.value = false;
    query.value = '';
    active.value = 0;
}

function go(hit?: Hit) {
    if (!hit) return;
    track('search', { search_term: query.value.trim(), destination: hit.path + (hit.hash ?? '') });
    navigate(hit.path, hit.hash);
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
                :placeholder="t('Search components, examples, guides and templates…')"
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
                <li v-for="(hit, index) in hits" :key="hit.path + (hit.hash ?? '')" role="presentation">
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
                        <Icon :icon="iconOf(hit)" />
                        {{ hit.label }}
                        <ChangeBadge :change="hit.change" />
                        <small>{{ hit.hint }}</small>
                    </button>
                </li>
            </ul>
            <p v-else class="search-empty">{{ t('Nothing matches “{query}”.', { query }) }}</p>
        </div>
    </div>
</template>
