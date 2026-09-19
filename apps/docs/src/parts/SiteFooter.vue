<script setup lang="ts">
import { computed } from 'vue';
import { addons } from '../lib/addons';
import { chartEntries } from '../lib/charts';
import { sections } from '../lib/catalog';
import { guideSections } from '../lib/guides';
import { base, href } from '../lib/router';
import { templates } from '../templates';

/**
 * What the site holds, counted and listed from the same data the site is built
 * from. The columns used to be written by hand, which is why they had drifted:
 * the templates column listed categories under links to particular templates,
 * so "Commerce" opened Fernhill Supply, and the components column was four of
 * ninety-eight picked once and never revisited. Nothing here is typed twice, so
 * a section added upstairs turns up down here on its own.
 */
const componentCount = computed(() => sections.reduce((total, section) => total + section.items.length, 0));
const year = new Date().getFullYear();

const explore = computed(() => [
    { label: 'Components', to: '/components/button', count: componentCount.value },
    { label: 'Templates', to: '/templates', count: templates.length },
    { label: 'Charts', to: '/charts', count: chartEntries.length },
    { label: 'Addons', to: '/addons', count: addons.length },
    { label: 'Icons', to: '/icons', count: null }
]);
</script>

<template>
    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-about">
                <div class="brand"><span class="brand-mark" aria-hidden="true" />Vitral</div>
                <p>Stained glass: many pieces of coloured glass held in one frame, with the light (the theme) coming through all of them at once.</p>
            </div>

            <div>
                <h4>Explore</h4>
                <ul>
                    <li v-for="item in explore" :key="item.to">
                        <a :href="href(item.to)">{{ item.label }}<small v-if="item.count">{{ item.count }}</small></a>
                    </li>
                </ul>
            </div>

            <div>
                <h4>Documentation</h4>
                <ul>
                    <li v-for="group in guideSections" :key="group.section">
                        <a :href="href(`/docs/${group.items[0]!.id}`)">{{ group.section }}</a>
                    </li>
                </ul>
            </div>

            <div>
                <h4>Project</h4>
                <ul>
                    <li><a :href="href('/docs/contributing')">Contributing</a></li>
                    <li><a :href="`${base}/llms.txt`">llms.txt</a></li>
                    <li><a href="https://github.com/vitralui/vitral" target="_blank" rel="noreferrer">GitHub</a></li>
                    <li><a href="https://www.npmjs.com/package/@vitral/vue" target="_blank" rel="noreferrer">npm</a></li>
                </ul>
            </div>
        </div>
        <p class="footer-note">© {{ year }} Vitral · LGPL-3.0-or-later. Built with Vitral.</p>
    </footer>
</template>
