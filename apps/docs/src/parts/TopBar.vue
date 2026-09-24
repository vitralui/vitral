<script setup lang="ts">
import { t } from '../lib/i18n';
import { href } from '../lib/router';
import { Button, Icon, useTheme } from '@vitral/vue';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { REPO_URL } from '../lib/links';
import LangMenu from './LangMenu.vue';
import MegaMenu from './MegaMenu.vue';
import SearchBar from './SearchBar.vue';
import ThemeMenu from './ThemeMenu.vue';

const search = defineModel<boolean>('search', { default: false });
const theme = useTheme();
const searchButton = ref<HTMLButtonElement | null>(null);
const inner = ref<HTMLElement | null>(null);
const brand = ref<HTMLElement | null>(null);

/**
 * The search opens out of its own button: the field ends where the button
 * ends and reaches back to the brand, over the menus, while the buttons after
 * it stay where they are. Below 600px there is no field worth typing in
 * beside five buttons, so there it takes the whole bar.
 */
const NARROW = 600;
const place = ref<Record<string, string>>({});

function measure() {
    const bar = inner.value?.getBoundingClientRect();
    const mark = brand.value?.getBoundingClientRect();
    const button = searchButton.value?.getBoundingClientRect();
    if (!bar || !mark || !button || !inner.value) return;
    const gutter = parseFloat(getComputedStyle(inner.value).paddingInlineStart) || 16;
    if (bar.width < NARROW) {
        place.value = { '--search-start': `${gutter}px`, '--search-end': `${gutter}px` };
        return;
    }
    const rtl = getComputedStyle(inner.value).direction === 'rtl';
    const start = rtl ? bar.right - mark.left : mark.right - bar.left;
    const end = rtl ? button.left - bar.left : bar.right - button.right;
    place.value = { '--search-start': `${start + 16}px`, '--search-end': `${end}px` };
}

// Measured before the field is drawn, so it opens from the right place.
watch(search, (open) => {
    if (open) measure();
});

/**
 * The field is gone once the search closes, and focus with it: it goes back
 * to the button that opened the search, not to the top of the page. Only once
 * the field has finished closing, or the button's ring showed through it as it
 * faded; and with a ring only if the search was closed from the keyboard.
 */
let closedByKey = false;
function onKeyClose(event: KeyboardEvent) {
    closedByKey = event.key === 'Escape' || event.key === 'Enter';
}
function returnFocus() {
    searchButton.value?.focus({ preventScroll: true, focusVisible: closedByKey } as FocusOptions);
    closedByKey = false;
}

function onResize() {
    if (search.value) measure();
}
onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => window.removeEventListener('resize', onResize));

</script>

<template>
    <header class="topbar" :class="{ 'is-searching': search }">
        <div ref="inner" class="topbar-inner">
            <a ref="brand" class="brand" :href="href('/')">
                <span class="brand-mark" aria-hidden="true" />
                Vitral
                <span class="brand-version">0.1</span>
            </a>

            <!-- Kept mounted while the search is open, so the drawer's state and the
                 panels' survive it: the field is laid over them. -->
            <MegaMenu v-model:search="search" />

            <Transition name="searchbar" @after-leave="returnFocus">
                <SearchBar v-if="search" v-model:open="search" :style="place" @keydown.capture="onKeyClose" />
            </Transition>

            <div class="top-actions">
                <button
                    ref="searchButton"
                    class="search-btn"
                    type="button"
                    accesskey="3"
                    :aria-label="t('Search')"
                    :title="`${t('Search')} (Ctrl K)`"
                    aria-keyshortcuts="Control+K"
                    @click="search = true"
                >
                    <Icon icon="search" />
                </button>
                <LangMenu />
                <ThemeMenu />
                <Button
                    :icon="theme.isDark.value ? 'sun' : 'moon'"
                    variant="text"
                    severity="secondary"
                    :aria-label="theme.isDark.value ? t('Switch to the light scheme') : t('Switch to the dark scheme')"
                    @click="theme.toggleDark()"
                />
                <a class="icon-link topbar-github" :href="REPO_URL" target="_blank" rel="noreferrer" :aria-label="t('Vitral on GitHub')">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path
                            d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
                        />
                    </svg>
                </a>
            </div>
        </div>
    </header>
</template>
