<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { computed } from 'vue';
import { addons } from '../lib/addons';
import { apiOf } from '../lib/api';
import { entryOf } from '../lib/catalog';
import { href, route } from '../lib/router';
import { slugify } from '../lib/section';
import { sectionSources } from '../lib/source';

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
    const sections = [...sectionSources(entry.file).keys()].map((title) => ({ id: slugify(title), label: title }));
    const api = apiOf(entry.file)?.props.length ? [{ id: 'api', label: 'API' }] : [];
    return [...sections.slice(0, MOST), ...api];
};

const panels = computed(() =>
    addons.map((addon) => {
        const entry = entryOf(addon.component);
        const total = entry ? sectionSources(entry.file).size : 0;
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
        <h2>Addons</h2>
        <details v-for="addon in panels" :key="addon.id" class="addon" :open="addon.current">
            <summary class="addon-summary">
                <Icon :icon="addon.icon" class="addon-icon" />
                <span class="addon-title">{{ addon.title }}</span>
                <Icon icon="chevronDown" class="addon-chevron" />
            </summary>
            <ul class="addon-routes">
                <li v-if="addon.to !== addon.page">
                    <a :href="href(addon.to)" class="addon-route">{{ addon.title === 'Charts' ? 'Every kind, live' : 'Overview' }}</a>
                </li>
                <li v-for="link in addon.routes" :key="link.id">
                    <a :href="href(`${addon.page}#${link.id}`)" class="addon-route">{{ link.label }}</a>
                </li>
                <li v-if="addon.rest">
                    <a :href="href(addon.page)" class="addon-route addon-route-more">{{ addon.rest }} more <Icon icon="arrowRight" /></a>
                </li>
            </ul>
        </details>
    </div>
</template>
