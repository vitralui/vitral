<script setup lang="ts">
import { computed } from 'vue';
import { chartEntries } from '../lib/charts';
import { sections } from '../lib/catalog';
import { guideSections, sectionName } from '../lib/guides';
import { t } from '../lib/i18n';
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
    { label: t('Components'), to: '/components', count: componentCount.value },
    { label: 'Templates', to: '/templates', count: templates.length },
    { label: t('Charts'), to: '/charts', count: chartEntries.length },
    { label: t('Icons'), to: '/icons', count: null }
]);
</script>

<template>
    <!-- eMAG 1.6: the four keys every Brazilian public site shares. The footer
         takes focus so the key has somewhere to land. -->
    <footer class="footer" tabindex="-1" accesskey="4">
        <div class="footer-inner">
            <div class="footer-about">
                <div class="brand"><span class="brand-mark" aria-hidden="true" />Vitral</div>
                <p>{{ t('A Vue 3 component library on a token engine: one set of tokens themes every component, light and dark, with the WAI-ARIA behaviour built in.') }}</p>
            </div>

            <div>
                <h4>{{ t('Explore') }}</h4>
                <ul>
                    <li v-for="item in explore" :key="item.to">
                        <a :href="href(item.to)">{{ item.label }}<small v-if="item.count">{{ item.count }}</small></a>
                    </li>
                </ul>
            </div>

            <div>
                <h4>{{ t('Documentation') }}</h4>
                <ul>
                    <li v-for="group in guideSections" :key="group.section">
                        <a :href="href(`/docs/${group.items[0]!.id}`)">{{ sectionName(group.section) }}</a>
                    </li>
                </ul>
            </div>

            <div>
                <h4>{{ t('Project') }}</h4>
                <ul>
                    <li><a :href="href('/docs/contributing')">{{ t('Contributing') }}</a></li>
                    <li><a :href="`${base}/llms.txt`">llms.txt</a></li>
                    <li><a href="https://github.com/vitralui/vitral" target="_blank" rel="noreferrer">GitHub</a></li>
                    <li><a href="https://www.npmjs.com/package/@vitral/vue" target="_blank" rel="noreferrer">npm</a></li>
                </ul>
            </div>
        </div>
        <p class="footer-note">© {{ year }} Vitral · LGPL-3.0-or-later. {{ t('Built with Vitral.') }}</p>
    </footer>
</template>
