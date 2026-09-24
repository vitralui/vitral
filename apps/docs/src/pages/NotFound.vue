<script setup lang="ts">
import { Button } from '@vitral/vue';
import { computed } from 'vue';
import { t } from '../lib/i18n';
import { base, href, route } from '../lib/router';

/**
 * The page for an address that is not one of ours. It is deliberately plain:
 * somebody arrives here having already not found what they wanted, and a wall
 * of suggestions is another thing to read before they can get on.
 *
 * `scripts/prerender.mjs` writes this page as `404.html`, which is what a
 * static host serves for an unknown path.
 */
const suggestions = computed(() => [
    { label: t('Components'), to: '/components', note: t('The whole set, by category') },
    { label: t('Documentation'), to: '/docs/introduction', note: t('Installing, theming, customising') },
    { label: 'Templates', to: '/templates', note: t('Whole applications, live') },
    { label: t('Icons'), to: '/icons', note: t('The icon set, searchable') }
]);
</script>

<template>
    <main class="notfound">
        <p class="notfound-code">404</p>
        <h1>{{ t('This page does not exist') }}</h1>
        <p class="notfound-lead">
            <template v-if="route.path !== '/'">
                {{ t('Nothing is published at') }} <code>{{ base }}{{ route.path }}</code
                >.
            </template>
            {{ t('The link may be out of date, or the address may have a typo in it.') }}
        </p>

        <div class="notfound-actions">
            <Button :label="t('Go to the start')" as="a" :href="href('/')" />
            <Button :label="t('Browse the components')" severity="secondary" variant="outlined" as="a" :href="href('/components')" />
        </div>

        <ul class="notfound-links">
            <li v-for="item in suggestions" :key="item.to">
                <a :href="href(item.to)">
                    <b>{{ item.label }}</b>
                    <span>{{ item.note }}</span>
                </a>
            </li>
        </ul>
    </main>
</template>
