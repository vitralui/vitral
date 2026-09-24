<script setup lang="ts">
import { Icon } from '@vitral/vue';
import { categoryName } from '../demo';
import { entryText, sections } from '../lib/catalog';
import { guideSections, guideText, sectionName } from '../lib/guides';
import { t } from '../lib/i18n';
import { href, route } from '../lib/router';
import AddonNav from './AddonNav.vue';

/**
 * Every page of a section, grouped: the guides, or the components with the
 * addons at their head. The same list is the pane beside the page on a wide
 * screen and the drawer the local bar opens on a narrow one.
 */
defineProps<{ docs: boolean }>();
</script>

<template>
    <template v-if="docs">
        <template v-for="group in guideSections" :key="group.section">
            <h2>{{ sectionName(group.section) }}</h2>
            <a v-for="guide in group.items" :key="guide.id" :href="href(`/docs/${guide.id}`)" :aria-current="route.id === guide.id ? 'page' : undefined">
                {{ guideText(guide).title }}
            </a>
        </template>
        <h2>{{ t('Components') }}</h2>
        <a :href="href('/components')" class="pane-more">{{ t('All components') }} <Icon icon="arrowRight" /></a>
    </template>

    <template v-else>
        <AddonNav />
        <template v-for="group in sections" :key="group.category">
            <h2>{{ categoryName(group.category) }}</h2>
            <a v-for="entry in group.items" :key="entry.id" :href="href(`/components/${entry.id}`)" :aria-current="route.id === entry.id ? 'page' : undefined">
                {{ entryText(entry).title }}
            </a>
        </template>
    </template>
</template>
