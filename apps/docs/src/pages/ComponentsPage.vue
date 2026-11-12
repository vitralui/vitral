<script setup lang="ts">
import { Icon, IconField, InputIcon, InputText, ToggleButton } from '@vitral/vue';
import { computed, ref } from 'vue';
import { categoryName } from '../demo';
import { entries, entryText, sections } from '../lib/catalog';
import { componentChange } from '../lib/changes';
import { t } from '../lib/i18n';
import { href } from '../lib/router';
import ChangeBadge from '../parts/ChangeBadge.vue';

/**
 * The whole catalogue on one page, by category. `/components` used to open
 * the first component there is, so "Components" in the menu, on the home page
 * and in the footer all landed the reader on Button without saying why.
 */
const query = ref('');
/** Only what the last few releases added or changed. */
const recent = ref(false);
const recentCount = entries.filter((entry) => componentChange(entry.file)).length;

const groups = computed(() => {
    const words = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return sections
        .map((section) => ({
            category: section.category,
            items: section.items
                .filter((entry) => !recent.value || componentChange(entry.file))
                .map((entry) => ({ entry, text: entryText(entry) }))
                .filter(({ entry, text }) => {
                    const haystack = `${entry.id} ${text.title} ${text.description ?? ''} ${categoryName(section.category)}`.toLowerCase();
                    return words.every((word) => haystack.includes(word));
                })
        }))
        .filter((group) => group.items.length > 0);
});

const count = computed(() => groups.value.reduce((total, group) => total + group.items.length, 0));
</script>

<template>
    <main class="components-page">
        <div class="doc-head">
            <span class="eyebrow">{{ t('Components') }}</span>
            <h1>{{ t('{count} components', { count: entries.length }) }}</h1>
            <p>{{ t('Every component, by what it is for. Each page has live examples, the markup behind them and the API read from the source.') }}</p>
        </div>

        <div class="components-filters">
            <IconField class="components-search">
                <InputIcon icon="search" />
                <InputText v-model="query" type="search" :placeholder="t('Filter by name or purpose')" :aria-label="t('Filter the components')" fluid />
            </IconField>
            <!-- Without a release history to read (see scripts/changes.ts) there is nothing to filter by. -->
            <ToggleButton v-if="recentCount" v-model="recent" class="components-recent">
                {{ t('New and updated') }} <small>{{ recentCount }}</small>
            </ToggleButton>
            <a :href="href('/releases')" class="components-news">{{ t("What's new") }} <Icon icon="arrowRight" /></a>
        </div>
        <p class="vt-sr-only" aria-live="polite">{{ t('{count} components', { count }) }}</p>

        <section v-for="group in groups" :key="group.category" class="components-group" :aria-labelledby="`components-${group.category}`">
            <h2 :id="`components-${group.category}`">
                {{ categoryName(group.category) }} <small>{{ group.items.length }}</small>
            </h2>
            <ul class="components-grid">
                <li v-for="{ entry, text } in group.items" :key="entry.id">
                    <a :href="href(`/components/${entry.id}`)" class="components-card">
                        <b>{{ text.title }} <ChangeBadge :change="componentChange(entry.file)" /></b>
                        <span v-if="text.description">{{ text.description }}</span>
                    </a>
                </li>
            </ul>
        </section>

        <p v-if="!groups.length" class="components-empty">{{ query.trim() ? t('Nothing matches “{query}”.', { query }) : t('Nothing new or updated in the last few releases.') }}</p>
    </main>
</template>
