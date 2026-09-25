<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { computed } from 'vue';
import { addons, addonTitle } from '../lib/addons';
import { apiOf } from '../lib/api';
import { entryOf, sectionText } from '../lib/catalog';
import { t } from '../lib/i18n';
import { href, route } from '../lib/router';
import { slugify } from '../lib/section';

// The addons at the head of the sidebar. They are the parts of Vitral that
// draw themselves — plain TypeScript, no framework in them — so they are worth
// finding before the component list rather than buried alphabetically inside
// it.
//
// Opening one lists where it can actually be gone to. Those are not invented:
// every demo section on a component page is already an anchor, and the API
// table is another, so what is listed here is the page's own table of
// contents. A reader looking for how the grid filters lands on filtering
// rather than on the top of a long page.

/** More than this and the panel stops being a shortcut; the rest is one link away. */
const MOST = 8;

interface Route {
    id: string;
    label: string;
}

const linksFor = (component: string): Route[] => {
    const entry = entryOf(component);
    if (!entry) return [];
    const sections = entry.sections.map((title) => ({ id: slugify(title), label: sectionText(entry, title).title }));
    const api = apiOf(entry.file)?.props.length ? [{ id: 'api', label: 'API' }] : [];
    return [...sections.slice(0, MOST), ...api];
};

const panels = computed(() =>
    addons.map((addon) => {
        const entry = entryOf(addon.component);
        const total = entry ? entry.sections.length : 0;
        return {
            ...addon,
            page: `/components/${addon.component}`,
            routes: linksFor(addon.component),
            // Only worth saying when the list was cut short.
            rest: total > MOST ? total - MOST : 0,
            current: route.value.id === addon.component
        };
    })
);
</script>

<template>
    <div class="addon-nav">
        <h2>{{ t('Addons') }}</h2>
        <details v-for="addon in panels" :key="addon.id" class="addon" :open="addon.current">
            <summary class="addon-summary">
                <Icon :icon="addon.icon" class="addon-icon" />
                <span class="addon-title">{{ addonTitle(addon) }}</span>
                <Icon icon="chevronDown" class="addon-chevron" />
            </summary>
            <ul class="addon-routes">
                <li v-if="addon.to !== addon.page">
                    <a :href="href(addon.to)" class="addon-route">{{ addon.title === 'Charts' ? t('Every kind, live') : t('Overview') }}</a>
                </li>
                <li v-for="link in addon.routes" :key="link.id">
                    <a :href="href(`${addon.page}#${link.id}`)" class="addon-route">{{ link.label }}</a>
                </li>
                <li v-if="addon.rest">
                    <a :href="href(addon.page)" class="addon-route addon-route-more">{{ t('{count} more', { count: addon.rest }) }} <Icon icon="arrowRight" /></a>
                </li>
            </ul>
        </details>
    </div>
</template>
