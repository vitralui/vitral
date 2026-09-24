<script setup lang="ts">
import { Icon, Popover } from '@vitral/vue';
import { ref, watch } from 'vue';
import { direction } from '../lib/theme';
import { lang, languages, langs, t, type Lang } from '../lib/i18n';
import { hrefIn, route } from '../lib/router';

/**
 * The language menu: each language by its own name, as its readers write it,
 * with a flag to find it by at a glance. Every entry is a link to the same
 * page in that language — what a crawler follows from one version to the
 * next.
 */
const popover = ref<InstanceType<typeof Popover> | null>(null);

/** Drawn here rather than as emoji: Windows has no flag emoji, and shows two letters instead. */
const flags: Record<Lang, string> = {
    en: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><path d="M0 0h20v1.08H0zm0 2.15h20v1.08H0zm0 2.16h20v1.07H0zm0 2.15h20v1.08H0zm0 2.15h20v1.08H0zm0 2.16h20v1.07H0zm0 2.15h20V14H0z" fill="#b22234"/><rect width="8.5" height="7.54" fill="#3c3b6e"/></svg>',
    'pt-br': '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#009b3a"/><path d="M10 1.6 18.2 7 10 12.4 1.8 7z" fill="#fedf00"/><circle cx="10" cy="7" r="3.2" fill="#002776"/></svg>'
};
const open = ref(false);

// Closed when the page turns over, like every other menu in the bar.
watch(direction, () => popover.value?.hide(false));

function choose() {
    popover.value?.hide();
}
</script>

<template>
    <button
        class="lang-switch"
        type="button"
        aria-haspopup="true"
        :aria-expanded="open"
        :aria-label="t('Language: {name}', { name: languages[lang].name })"
        @click="popover?.toggle($event)"
    >
        <span class="lang-flag" aria-hidden="true" v-html="flags[lang]" />
        <span class="lang-code">{{ languages[lang].short }}<Icon icon="chevronDown" /></span>
    </button>
    <Popover ref="popover" placement="bottom-end" :aria-label="t('Language')" @show="open = true" @hide="open = false">
        <ul class="lang-list">
            <li v-for="which in langs" :key="which">
                <a
                    :href="hrefIn(which, route.path)"
                    :hreflang="languages[which].tag"
                    :lang="languages[which].tag"
                    :aria-current="which === lang ? 'true' : undefined"
                    @click="choose"
                >
                    <span class="lang-flag" aria-hidden="true" v-html="flags[which]" />
                    {{ languages[which].name }}
                    <Icon v-if="which === lang" icon="check" class="lang-check" />
                </a>
            </li>
        </ul>
    </Popover>
</template>
