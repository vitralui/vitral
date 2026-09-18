<script setup lang="ts">
import { Button } from '@vitral/vue';
import { base, href, route } from '../lib/router';

/**
 * The page for an address that is not one of ours. It is deliberately plain:
 * somebody arrives here having already not found what they wanted, and a wall
 * of suggestions is another thing to read before they can get on.
 *
 * `scripts/prerender.mjs` writes this page as `404.html`, which is what a
 * static host serves for an unknown path.
 */
const suggestions = [
    { label: 'Components', to: '/components/button', note: 'The whole set, by category' },
    { label: 'Documentation', to: '/docs/introduction', note: 'Installing, theming, customising' },
    { label: 'Templates', to: '/templates', note: 'Whole applications, live' },
    { label: 'Icons', to: '/icons', note: 'The icon set, searchable' }
];
</script>

<template>
    <main class="notfound">
        <p class="notfound-code">404</p>
        <h1>This page does not exist</h1>
        <p class="notfound-lead">
            <template v-if="route.path !== '/'">
                Nothing is published at <code>{{ base }}{{ route.path }}</code
                >.
            </template>
            The link may be out of date, or the address may have a typo in it.
        </p>

        <div class="notfound-actions">
            <Button label="Go to the start" as="a" :href="href('/')" />
            <Button label="Browse the components" severity="secondary" variant="outlined" as="a" :href="href('/components/button')" />
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
